import { storage } from "../storage";

export interface CalendarInvite {
  email: string;
  name: string;
  eventType: string;
}

export class CalendarService {
  private async getCalendlyConfig() {
    const setting = await storage.getIntegrationSettingByProvider("calendly");
    
    if (!setting || !setting.isActive) {
      throw new Error("Calendly integration not configured");
    }

    return {
      apiKey: setting.config.apiKey as string,
      eventTypeUrl: setting.config.eventTypeUrl as string,
    };
  }

  async createInvite(invite: CalendarInvite): Promise<{ success: boolean; inviteUrl?: string; error?: string }> {
    try {
      const config = await this.getCalendlyConfig();

      return {
        success: false,
        error: "Calendly API integration not yet implemented. Requires Calendly API v2 setup."
      };
    } catch (error: any) {
      console.error("Calendar invite error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export const calendarService = new CalendarService();
