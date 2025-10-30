import { storage } from "../storage";
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface LinkedInOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export class OAuthService {
  // Store OAuth state in Redis for validation (expires in 10 minutes)
  private async storeOAuthState(state: string, userId: string, provider: string): Promise<void> {
    const key = `oauth_state:${state}`;
    await redis.setex(key, 600, JSON.stringify({ userId, provider, timestamp: Date.now() }));
  }

  // Validate and consume OAuth state (one-time use)
  private async validateOAuthState(state: string, expectedUserId: string, expectedProvider: string): Promise<boolean> {
    const key = `oauth_state:${state}`;
    const data = await redis.get(key);
    
    if (!data) {
      return false;
    }

    try {
      const parsed = JSON.parse(data);
      
      // Delete state immediately after reading (one-time use)
      await redis.del(key);
      
      // Validate that userId and provider match
      return parsed.userId === expectedUserId && parsed.provider === expectedProvider;
    } catch {
      return false;
    }
  }

  // Google OAuth (for Gmail and Calendar)
  async getGoogleAuthUrl(state: string, userId: string): Promise<string> {
    // Store state in Redis for validation
    await this.storeOAuthState(state, userId, "google");
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || "",
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || "",
      response_type: "code",
      scope: [
        "https://www.googleapis.com/auth/gmail.send",
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/userinfo.email",
      ].join(" "),
      access_type: "offline",
      prompt: "consent",
      state: state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async exchangeGoogleCode(code: string, userId: string, state: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    email: string;
  }> {
    // Validate state before proceeding
    const isValidState = await this.validateOAuthState(state, userId, "google");
    if (!isValidState) {
      throw new Error("Invalid or expired OAuth state. Possible CSRF attack.");
    }

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: process.env.GOOGLE_REDIRECT_URI || "",
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google OAuth token exchange failed: ${error}`);
    }

    const data = await response.json();

    // Get user info to get email
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      }
    );

    if (!userInfoResponse.ok) {
      throw new Error("Failed to get user info from Google");
    }

    const userInfo = await userInfoResponse.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      email: userInfo.email,
    };
  }

  async refreshGoogleToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        grant_type: "refresh_token",
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google token refresh failed: ${error}`);
    }

    const data = await response.json();

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
    };
  }

  // LinkedIn OAuth
  async getLinkedInAuthUrl(state: string, userId: string): Promise<string> {
    // Store state in Redis for validation
    await this.storeOAuthState(state, userId, "linkedin");
    const params = new URLSearchParams({
      response_type: "code",
      client_id: process.env.LINKEDIN_CLIENT_ID || "",
      redirect_uri: process.env.LINKEDIN_REDIRECT_URI || "",
      scope: "openid profile email w_member_social",
      state: state,
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  async exchangeLinkedInCode(code: string, userId: string, state: string): Promise<{
    accessToken: string;
    expiresIn: number;
    email: string;
  }> {
    // Validate state before proceeding
    const isValidState = await this.validateOAuthState(state, userId, "linkedin");
    if (!isValidState) {
      throw new Error("Invalid or expired OAuth state. Possible CSRF attack.");
    }

    const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: process.env.LINKEDIN_CLIENT_ID || "",
        client_secret: process.env.LINKEDIN_CLIENT_SECRET || "",
        redirect_uri: process.env.LINKEDIN_REDIRECT_URI || "",
      }).toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LinkedIn OAuth token exchange failed: ${error}`);
    }

    const data = await response.json();

    // Get user profile to get email
    const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      throw new Error("Failed to get LinkedIn profile");
    }

    const profile = await profileResponse.json();

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      email: profile.email,
    };
  }

  // Helper method to check if token is expired and refresh if needed
  async ensureValidToken(userId: string, provider: string): Promise<string> {
    const credential = await storage.getOAuthCredentialByProvider(userId, provider);
    
    if (!credential) {
      throw new Error(`No ${provider} credentials found for user`);
    }

    // Check if token is expired or about to expire (within 5 minutes)
    const now = new Date();
    const expiresAt = credential.expiresAt ? new Date(credential.expiresAt) : null;
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    if (!expiresAt || expiresAt <= fiveMinutesFromNow) {
      // Token expired or about to expire, refresh it
      if (provider === "google" && credential.refreshToken) {
        const refreshed = await this.refreshGoogleToken(credential.refreshToken);
        const newExpiresAt = new Date(now.getTime() + refreshed.expiresIn * 1000);
        
        await storage.refreshOAuthToken(
          userId,
          provider,
          refreshed.accessToken,
          null, // Google doesn't return new refresh token
          newExpiresAt
        );

        return refreshed.accessToken;
      } else {
        throw new Error(`${provider} token expired and cannot be refreshed. Please reconnect your account.`);
      }
    }

    return credential.accessToken;
  }
}

export const oauthService = new OAuthService();
