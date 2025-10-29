import { storage } from "../storage";

export interface SMSMessage {
  to: string;
  content: string;
  fromNumber?: string;
}

export class SMSService {
  private async getTwilioConfig() {
    const setting = await storage.getIntegrationSettingByProvider("twilio");
    
    if (!setting || !setting.isActive) {
      throw new Error("Twilio integration not configured");
    }

    const accountSid = setting.config.accountSid as string;
    const authToken = setting.config.authToken as string;
    const fromNumber = setting.config.fromNumber as string;

    if (!accountSid || !authToken) {
      throw new Error("Twilio credentials not found");
    }

    return { accountSid, authToken, fromNumber };
  }

  async sendSMS(message: SMSMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const config = await this.getTwilioConfig();

      const fromNumber = message.fromNumber || config.fromNumber;
      if (!fromNumber) {
        throw new Error("No Twilio phone number configured");
      }

      const credentials = Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64");

      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${credentials}`,
          },
          body: new URLSearchParams({
            To: message.to,
            From: fromNumber,
            Body: message.content,
          }).toString(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Twilio API error: ${response.status} - ${errorData.message || "Unknown error"}`);
      }

      const data = await response.json();

      return {
        success: true,
        messageId: data.sid,
      };
    } catch (error: any) {
      console.error("SMS sending error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export const smsService = new SMSService();
