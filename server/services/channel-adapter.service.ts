import { emailService } from "./email.service";
import { smsService } from "./sms.service";
import { storage } from "../storage";
import { logger } from "./logger.service";

export interface ChannelMessage {
  to: string;
  subject?: string;
  content: string;
  fromName?: string;
  fromEmail?: string;
  fromNumber?: string;
}

export interface SendResult {
  success: boolean;
  channel: string;
  messageId?: string;
  error?: string;
}

export interface ChannelAdapter {
  name: string;
  isAvailable(): Promise<boolean>;
  send(message: ChannelMessage): Promise<SendResult>;
}

class EmailAdapter implements ChannelAdapter {
  name = "email";

  async isAvailable(): Promise<boolean> {
    try {
      const setting = await storage.getIntegrationSettingByProvider("sendgrid");
      return !!(setting && setting.isActive && setting.config.apiKey);
    } catch {
      return false;
    }
  }

  async send(message: ChannelMessage): Promise<SendResult> {
    if (!message.subject) {
      return { success: false, channel: this.name, error: "Email requires a subject" };
    }

    const result = await emailService.sendEmail({
      to: message.to,
      subject: message.subject,
      content: message.content,
      fromName: message.fromName,
      fromEmail: message.fromEmail,
    });

    return {
      ...result,
      channel: this.name,
    };
  }
}

class SMSAdapter implements ChannelAdapter {
  name = "sms";

  async isAvailable(): Promise<boolean> {
    try {
      const setting = await storage.getIntegrationSettingByProvider("twilio");
      return !!(setting && setting.isActive && setting.config.accountSid);
    } catch {
      return false;
    }
  }

  async send(message: ChannelMessage): Promise<SendResult> {
    const result = await smsService.sendSMS({
      to: message.to,
      content: message.content,
      fromNumber: message.fromNumber,
    });

    return {
      ...result,
      channel: this.name,
    };
  }
}

class LinkedInAdapter implements ChannelAdapter {
  name = "linkedin";

  async isAvailable(): Promise<boolean> {
    try {
      const setting = await storage.getIntegrationSettingByProvider("linkedin");
      return !!(setting && setting.isActive);
    } catch {
      return false;
    }
  }

  async send(message: ChannelMessage): Promise<SendResult> {
    logger.warn("LinkedIn adapter not fully implemented yet");
    return {
      success: false,
      channel: this.name,
      error: "LinkedIn integration not yet implemented",
    };
  }
}

class CalendarAdapter implements ChannelAdapter {
  name = "calendar";

  async isAvailable(): Promise<boolean> {
    try {
      const setting = await storage.getIntegrationSettingByProvider("calendly");
      return !!(setting && setting.isActive);
    } catch {
      return false;
    }
  }

  async send(message: ChannelMessage): Promise<SendResult> {
    logger.warn("Calendar adapter not fully implemented yet");
    return {
      success: false,
      channel: this.name,
      error: "Calendar integration not yet implemented",
    };
  }
}

export class ChannelAdapterService {
  private adapters: Map<string, ChannelAdapter>;
  private fallbackOrder: string[] = ["email", "sms", "linkedin"];

  constructor() {
    this.adapters = new Map();
    this.adapters.set("email", new EmailAdapter());
    this.adapters.set("sms", new SMSAdapter());
    this.adapters.set("linkedin", new LinkedInAdapter());
    this.adapters.set("calendar", new CalendarAdapter());
  }

  async sendWithFallback(
    message: ChannelMessage,
    preferredChannels: string[]
  ): Promise<SendResult> {
    const channelsToTry = [...preferredChannels, ...this.fallbackOrder].filter(
      (channel, index, self) => self.indexOf(channel) === index
    );

    let lastError: string | undefined;

    for (const channelName of channelsToTry) {
      const adapter = this.adapters.get(channelName);
      if (!adapter) {
        logger.warn(`Unknown channel adapter: ${channelName}`);
        continue;
      }

      const isAvailable = await adapter.isAvailable();
      if (!isAvailable) {
        logger.info(`Channel ${channelName} is not available, trying next...`);
        lastError = `${channelName} not configured`;
        continue;
      }

      logger.info(`Attempting to send message via ${channelName}`);
      const result = await adapter.send(message);

      if (result.success) {
        logger.info(`Successfully sent message via ${channelName}`);
        return result;
      }

      logger.warn(`Failed to send via ${channelName}: ${result.error}`);
      lastError = result.error;
    }

    return {
      success: false,
      channel: "none",
      error: `All channels failed. Last error: ${lastError}`,
    };
  }

  async send(channel: string, message: ChannelMessage): Promise<SendResult> {
    const adapter = this.adapters.get(channel);
    if (!adapter) {
      return {
        success: false,
        channel,
        error: `Unknown channel: ${channel}`,
      };
    }

    const isAvailable = await adapter.isAvailable();
    if (!isAvailable) {
      return {
        success: false,
        channel,
        error: `Channel ${channel} is not configured or unavailable`,
      };
    }

    return await adapter.send(message);
  }

  async getAvailableChannels(): Promise<string[]> {
    const available: string[] = [];
    
    for (const [name, adapter] of Array.from(this.adapters.entries())) {
      if (await adapter.isAvailable()) {
        available.push(name);
      }
    }

    return available;
  }
}

export const channelAdapter = new ChannelAdapterService();
