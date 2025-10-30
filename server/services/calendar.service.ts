import { storage } from "../storage";
import { oauthService } from "./oauth.service";

export interface CalendarInvite {
  email: string;
  name: string;
  eventType: string;
  userId?: string;
  startTime?: string;
  endTime?: string;
  description?: string;
}

export class CalendarService {
  // Create meeting via Google Calendar OAuth
  async createViaGoogleCalendar(invite: CalendarInvite, userId: string): Promise<{ success: boolean; inviteUrl?: string; error?: string }> {
    try {
      const accessToken = await oauthService.ensureValidToken(userId, "google");

      const startTime = invite.startTime || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Default to tomorrow
      const endTime = invite.endTime || new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString(); // 1 hour duration

      const event = {
        summary: `${invite.eventType} with ${invite.name}`,
        description: invite.description || `Meeting scheduled via OmniReach`,
        start: {
          dateTime: startTime,
          timeZone: "America/New_York",
        },
        end: {
          dateTime: endTime,
          timeZone: "America/New_York",
        },
        attendees: [
          { email: invite.email },
        ],
        reminders: {
          useDefault: true,
        },
        conferenceData: {
          createRequest: {
            requestId: `${Date.now()}`,
            conferenceSolutionKey: {
              type: "hangoutsMeet",
            },
          },
        },
      };

      const response = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Google Calendar API error: ${response.status} - ${error}`);
      }

      const data = await response.json();

      return {
        success: true,
        inviteUrl: data.htmlLink,
      };
    } catch (error: any) {
      console.error("Google Calendar error:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

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

  // Main method - tries Google Calendar first if userId provided
  async createInvite(invite: CalendarInvite): Promise<{ success: boolean; inviteUrl?: string; error?: string }> {
    // Try Google Calendar first if user ID is provided
    if (invite.userId) {
      try {
        const googleResult = await this.createViaGoogleCalendar(invite, invite.userId);
        if (googleResult.success) {
          return googleResult;
        }
        console.log("Google Calendar failed, no fallback available:", googleResult.error);
      } catch (error: any) {
        console.log("Google Calendar not available:", error.message);
      }
    }

    return {
      success: false,
      error: "No calendar integration configured. Please connect your Google Calendar in Settings."
    };
  }
}

export const calendarService = new CalendarService();
