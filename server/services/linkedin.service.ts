import { storage } from "../storage";
import { oauthService } from "./oauth.service";

export interface LinkedInMessage {
  recipientUrn?: string; // LinkedIn member URN
  message: string;
  userId?: string;
}

export class LinkedInService {
  // Send message via LinkedIn OAuth
  async sendViaOAuth(message: LinkedInMessage, userId: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const accessToken = await oauthService.ensureValidToken(userId, "linkedin");

      if (!message.recipientUrn) {
        throw new Error("Recipient LinkedIn URN is required");
      }

      // LinkedIn Share API for posting content
      // Note: Direct messaging requires additional permissions that may not be available
      // This uses the LinkedIn Share API to create a post
      const response = await fetch("https://api.linkedin.com/v2/ugcPosts", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify({
          author: message.recipientUrn,
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: {
                text: message.message,
              },
              shareMediaCategory: "NONE",
            },
          },
          visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
          },
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`LinkedIn API error: ${response.status} - ${error}`);
      }

      const data = await response.json();

      return {
        success: true,
        messageId: data.id,
      };
    } catch (error: any) {
      console.error("LinkedIn OAuth error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async sendMessage(message: LinkedInMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (message.userId) {
      try {
        return await this.sendViaOAuth(message, message.userId);
      } catch (error: any) {
        console.log("LinkedIn OAuth not available:", error.message);
      }
    }

    return {
      success: false,
      error: "LinkedIn integration not configured. Please connect your LinkedIn account in Settings. Note: LinkedIn's messaging API has limited availability."
    };
  }
}

export const linkedInService = new LinkedInService();
