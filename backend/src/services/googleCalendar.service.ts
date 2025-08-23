import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { EventLog } from '../models';
import { v4 as uuidv4 } from 'uuid';

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
}

export interface GoogleCalendarAvailability {
  start: string;
  end: string;
  available: boolean;
}

export class GoogleCalendarService {
  private static readonly GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  private static readonly GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  private static readonly GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

  /**
   * Create OAuth2 client for Google Calendar
   */
  private static createOAuth2Client(): OAuth2Client {
    if (!this.GOOGLE_CLIENT_ID || !this.GOOGLE_CLIENT_SECRET) {
      throw new Error('Google OAuth credentials not configured');
    }

    return new google.auth.OAuth2(
      this.GOOGLE_CLIENT_ID,
      this.GOOGLE_CLIENT_SECRET,
      this.GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Generate OAuth2 authorization URL
   */
  static generateAuthUrl(doctorId: string): string {
    const oauth2Client = this.createOAuth2Client();
    
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];

    const state = Buffer.from(JSON.stringify({ doctorId })).toString('base64');

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: state,
      prompt: 'consent'
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  static async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiryDate: number;
  }> {
    const oauth2Client = this.createOAuth2Client();
    
    try {
      const { tokens } = await oauth2Client.getToken(code);
      
      if (!tokens.access_token || !tokens.refresh_token) {
        throw new Error('Failed to obtain required tokens');
      }

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date || Date.now() + 3600000 // 1 hour default
      };
    } catch (error) {
      throw new Error(`Failed to exchange code for tokens: ${error}`);
    }
  }

  /**
   * Create a new calendar event
   */
  static async createEvent(
    refreshToken: string,
    calendarId: string,
    event: GoogleCalendarEvent,
    doctorId: string
  ): Promise<{ eventId: string; htmlLink: string }> {
    try {
      const oauth2Client = this.createOAuth2Client();
      oauth2Client.setCredentials({ refresh_token: refreshToken });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const response = await calendar.events.insert({
        calendarId,
        requestBody: event
      });

      const eventId = response.data.id;
      const htmlLink = response.data.htmlLink;

      if (!eventId) {
        throw new Error('Failed to create calendar event');
      }

      // Log the event creation
      await EventLog.create({
        id: uuidv4(),
        level: 'info',
        category: 'calendar',
        action: 'event_created',
        userId: doctorId,
        userType: 'doctor',
        resourceId: eventId,
        resourceType: 'calendar_event',
        details: { summary: event.summary, start: event.start.dateTime }
      });

      return { eventId, htmlLink: htmlLink || '' };
    } catch (error) {
      throw new Error(`Failed to create calendar event: ${error}`);
    }
  }

  /**
   * Update an existing calendar event
   */
  static async updateEvent(
    refreshToken: string,
    calendarId: string,
    eventId: string,
    event: Partial<GoogleCalendarEvent>,
    doctorId: string
  ): Promise<void> {
    try {
      const oauth2Client = this.createOAuth2Client();
      oauth2Client.setCredentials({ refresh_token: refreshToken });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      await calendar.events.update({
        calendarId,
        eventId,
        requestBody: event
      });

      // Log the event update
      await EventLog.create({
        id: uuidv4(),
        level: 'info',
        category: 'calendar',
        action: 'event_updated',
        userId: doctorId,
        userType: 'doctor',
        resourceId: eventId,
        resourceType: 'calendar_event',
        details: { summary: event.summary }
      });
    } catch (error) {
      throw new Error(`Failed to update calendar event: ${error}`);
    }
  }

  /**
   * Delete a calendar event
   */
  static async deleteEvent(
    refreshToken: string,
    calendarId: string,
    eventId: string,
    doctorId: string
  ): Promise<void> {
    try {
      const oauth2Client = this.createOAuth2Client();
      oauth2Client.setCredentials({ refresh_token: refreshToken });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      await calendar.events.delete({
        calendarId,
        eventId
      });

      // Log the event deletion
      await EventLog.create({
        id: uuidv4(),
        level: 'info',
        category: 'calendar',
        action: 'event_deleted',
        userId: doctorId,
        userType: 'doctor',
        resourceId: eventId,
        resourceType: 'calendar_event',
        details: {}
      });
    } catch (error) {
      throw new Error(`Failed to delete calendar event: ${error}`);
    }
  }

  /**
   * Get calendar availability for a specific time range
   */
  static async getAvailability(
    refreshToken: string,
    calendarId: string,
    startTime: string,
    endTime: string,
    doctorId: string
  ): Promise<GoogleCalendarAvailability[]> {
    try {
      const oauth2Client = this.createOAuth2Client();
      oauth2Client.setCredentials({ refresh_token: refreshToken });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      const response = await calendar.freebusy.query({
        requestBody: {
          timeMin: startTime,
          timeMax: endTime,
          items: [{ id: calendarId }]
        }
      });

      const busy = response.data.calendars?.[calendarId]?.busy || [];
      
      // Convert busy times to availability slots
      const availability: GoogleCalendarAvailability[] = [];
      let currentTime = new Date(startTime);

      for (const busySlot of busy) {
        const busyStart = new Date(busySlot.start || '');
        const busyEnd = new Date(busySlot.end || '');

        // Add available time before busy slot
        if (currentTime < busyStart) {
          availability.push({
            start: currentTime.toISOString(),
            end: busyStart.toISOString(),
            available: true
          });
        }

        // Add busy slot
        availability.push({
          start: busyStart.toISOString(),
          end: busyEnd.toISOString(),
          available: false
        });

        currentTime = busyEnd;
      }

      // Add remaining available time
      const endTimeDate = new Date(endTime);
      if (currentTime < endTimeDate) {
        availability.push({
          start: currentTime.toISOString(),
          end: endTimeDate.toISOString(),
          available: true
        });
      }

      return availability;
    } catch (error) {
      throw new Error(`Failed to get calendar availability: ${error}`);
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiryDate: number;
  }> {
    try {
      const oauth2Client = this.createOAuth2Client();
      oauth2Client.setCredentials({ refresh_token: refreshToken });

      const { credentials } = await oauth2Client.refreshAccessToken();
      
      if (!credentials.access_token) {
        throw new Error('Failed to refresh access token');
      }

      return {
        accessToken: credentials.access_token,
        expiryDate: credentials.expiry_date || Date.now() + 3600000
      };
    } catch (error) {
      throw new Error(`Failed to refresh access token: ${error}`);
    }
  }
}
