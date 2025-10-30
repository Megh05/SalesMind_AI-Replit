import { storage } from "../storage";
import { oauthService } from "./oauth.service";

export interface EmailMessage {
  to: string;
  subject: string;
  content: string;
  fromName?: string;
  fromEmail?: string;
  userId?: string; // User ID for OAuth-based sending
}

export class EmailService {
  // Send email via Gmail OAuth (preferred method)
  async sendViaGmail(message: EmailMessage, userId: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const accessToken = await oauthService.ensureValidToken(userId, "google");

      // Create email in RFC 2822 format
      const email = [
        `To: ${message.to}`,
        `Subject: ${message.subject}`,
        `Content-Type: text/html; charset=utf-8`,
        ``,
        message.content,
      ].join("\n");

      // Base64 encode the email
      const encodedEmail = Buffer.from(email)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          raw: encodedEmail,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gmail API error: ${response.status} - ${error}`);
      }

      const data = await response.json();

      return {
        success: true,
        messageId: data.id,
      };
    } catch (error: any) {
      console.error("Gmail sending error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
  private async getSendGridConfig() {
    const setting = await storage.getIntegrationSettingByProvider("sendgrid");
    
    if (!setting || !setting.isActive) {
      throw new Error("SendGrid integration not configured");
    }

    const apiKey = setting.config.apiKey as string;
    if (!apiKey) {
      throw new Error("SendGrid API key not found");
    }

    return {
      apiKey,
      fromEmail: setting.config.fromEmail as string || "noreply@omnireach.app",
      fromName: setting.config.fromName as string || "OmniReach",
    };
  }

  // Main send method - tries Gmail first if userId provided, falls back to SendGrid
  async sendEmail(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Try Gmail first if user ID is provided
    if (message.userId) {
      try {
        const gmailResult = await this.sendViaGmail(message, message.userId);
        if (gmailResult.success) {
          return gmailResult;
        }
        console.log("Gmail send failed, falling back to SendGrid:", gmailResult.error);
      } catch (error: any) {
        console.log("Gmail not available, falling back to SendGrid:", error.message);
      }
    }

    // Fall back to SendGrid
    return this.sendViaSendGrid(message);
  }

  // Send via SendGrid (fallback method)
  async sendViaSendGrid(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const config = await this.getSendGridConfig();

      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: message.to }],
              subject: message.subject,
            },
          ],
          from: {
            email: message.fromEmail || config.fromEmail,
            name: message.fromName || config.fromName,
          },
          content: [
            {
              type: "text/html",
              value: message.content,
            },
          ],
          tracking_settings: {
            click_tracking: {
              enable: true,
              enable_text: false,
            },
            open_tracking: {
              enable: true,
            },
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SendGrid API error: ${response.status} - ${errorText}`);
      }

      const messageId = response.headers.get("X-Message-Id") || undefined;

      return {
        success: true,
        messageId,
      };
    } catch (error: any) {
      console.error("Email sending error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export const emailService = new EmailService();
