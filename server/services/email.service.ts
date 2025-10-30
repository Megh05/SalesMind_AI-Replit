import { storage } from "../storage";

export interface EmailMessage {
  to: string;
  subject: string;
  content: string;
  fromName?: string;
  fromEmail?: string;
}

export class EmailService {
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

  async sendEmail(message: EmailMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
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
