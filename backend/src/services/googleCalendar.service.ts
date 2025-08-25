import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { EventLog, Doctor, Appointment } from '../models';
import { v4 as uuidv4 } from 'uuid';

export interface GoogleCalendarEvent {
  id?: string | null;
  summary: string;
  description?: string | null;
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
    displayName?: string | null;
  }>;
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  } | null;
}

export interface GoogleCalendarAvailability {
  start: string;
  end: string;
  available: boolean;
}

export interface CalendarSyncResult {
  totalEvents: number;
  newAppointments: number;
  updatedAppointments: number;
  errors: string[];
}

export class GoogleCalendarService {
  // Remove static readonly variables to ensure they are read at runtime

  /**
   * Create OAuth2 client for Google Calendar
   */
  private static createOAuth2Client(): OAuth2Client {
    const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI;
    
    console.log('🔧 [createOAuth2Client] Environment variables check:', {
      GOOGLE_CALENDAR_CLIENT_ID: !!clientId,
      GOOGLE_CALENDAR_CLIENT_SECRET: !!clientSecret,
      GOOGLE_CALENDAR_REDIRECT_URI: !!redirectUri,
      CLIENT_ID_LENGTH: clientId?.length || 0,
      CLIENT_SECRET_LENGTH: clientSecret?.length || 0
    });

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured. Please check GOOGLE_CALENDAR_CLIENT_ID and GOOGLE_CALENDAR_CLIENT_SECRET');
    }

    return new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
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
   * Check if a time slot is available in Google Calendar
   */
  static async checkAvailability(
    refreshToken: string,
    calendarId: string,
    startTime: string,
    endTime: string,
    doctorId: string
  ): Promise<boolean> {
    try {
      console.log('🔍 [GOOGLE CALENDAR] Checking availability:', { startTime, endTime });
      
      const oauth2Client = this.createOAuth2Client();
      oauth2Client.setCredentials({ refresh_token: refreshToken });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      // Query for events that overlap with the requested time slot
      const response = await calendar.events.list({
        calendarId,
        timeMin: startTime,
        timeMax: endTime,
        singleEvents: true,
        orderBy: 'startTime'
      });

      const events = response.data.items || [];
      const conflictingEvents = events.filter(event => {
        // Filter out events that are not busy (like free time blocks)
        return event.transparency !== 'transparent' && event.status !== 'cancelled';
      });

      const isAvailable = conflictingEvents.length === 0;
      
      console.log(`🔍 [GOOGLE CALENDAR] Found ${conflictingEvents.length} conflicting events`);
      if (conflictingEvents.length > 0) {
        console.log('🔍 [GOOGLE CALENDAR] Conflicting events:', conflictingEvents.map(e => ({
          summary: e.summary,
          start: e.start?.dateTime,
          end: e.end?.dateTime
        })));
      }

      // Log the availability check
      await EventLog.create({
        id: uuidv4(),
        level: 'info',
        category: 'calendar',
        action: 'availability_checked',
        userId: doctorId,
        userType: 'doctor',
        resourceType: 'time_slot',
        details: { 
          startTime, 
          endTime, 
          isAvailable, 
          conflictingEvents: conflictingEvents.length 
        }
      });

      return isAvailable;
    } catch (error) {
      console.error('❌ [GOOGLE CALENDAR] Error checking availability:', error);
      throw new Error(`Failed to check Google Calendar availability: ${error}`);
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

  /**
   * Get existing events from Google Calendar
   */
  static async fetchExistingEvents(
    refreshToken: string,
    calendarId: string,
    timeMin: Date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    timeMax: Date = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    doctorId: string
  ): Promise<GoogleCalendarEvent[]> {
    try {
      console.log(`🔧 [fetchExistingEvents] Starting with:`, {
        calendarId,
        doctorId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        hasRefreshToken: !!refreshToken
      });

      const oauth2Client = this.createOAuth2Client();
      oauth2Client.setCredentials({ refresh_token: refreshToken });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

      console.log(`📅 [fetchExistingEvents] Fetching events from calendar ${calendarId} for doctor ${doctorId}`);
      console.log(`⏰ [fetchExistingEvents] Time range: ${timeMin.toISOString()} to ${timeMax.toISOString()}`);

      const response = await calendar.events.list({
        calendarId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 2500 // Google Calendar API limit
      });

      const events = response.data.items || [];
      console.log(`✅ [fetchExistingEvents] Fetched ${events.length} events from Google Calendar`);

      // Try to log the fetch operation, but don't fail if EventLog is not available
      try {
        await EventLog.create({
          id: uuidv4(),
          level: 'info',
          category: 'calendar',
          action: 'events_fetched',
          userId: doctorId,
          userType: 'doctor',
          resourceId: calendarId,
          resourceType: 'calendar',
          details: { 
            eventCount: events.length,
            timeRange: { start: timeMin.toISOString(), end: timeMax.toISOString() }
          }
        });
      } catch (logError) {
        console.warn(`⚠️ [fetchExistingEvents] Could not log to EventLog:`, logError);
        // Continue execution even if logging fails
      }

      const mappedEvents = events
        .filter(event => event.id) // Filter out events without ID
        .map(event => ({
          id: event.id!,
          summary: event.summary || 'Sin título',
          description: event.description || undefined,
          start: {
            dateTime: event.start?.dateTime || event.start?.date || '',
            timeZone: event.start?.timeZone || 'America/Santiago'
          },
          end: {
            dateTime: event.end?.dateTime || event.end?.date || '',
            timeZone: event.end?.timeZone || 'America/Santiago'
          },
          attendees: event.attendees?.map(attendee => ({
            email: attendee.email || '',
            displayName: attendee.displayName || undefined
          })) || [],
          reminders: event.reminders ? {
            useDefault: event.reminders.useDefault || false,
            overrides: event.reminders.overrides?.map(override => ({
              method: (override.method as 'email' | 'popup') || 'popup',
              minutes: override.minutes || 0
            })) || []
          } : undefined
        }));

      console.log(`✅ [fetchExistingEvents] Successfully mapped ${mappedEvents.length} events`);
      return mappedEvents;

    } catch (error) {
      console.error('❌ [fetchExistingEvents] Error fetching existing events:', error);
      
      // Try to log the error, but don't fail if EventLog is not available
      try {
        await EventLog.create({
          id: uuidv4(),
          level: 'error',
          category: 'calendar',
          action: 'events_fetch_failed',
          userId: doctorId,
          userType: 'doctor',
          resourceId: calendarId,
          resourceType: 'calendar',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
      } catch (logError) {
        console.warn(`⚠️ [fetchExistingEvents] Could not log error to EventLog:`, logError);
      }

      throw new Error(`Failed to fetch existing events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sync existing Google Calendar events with local appointments
   */
  static async syncExistingAppointments(doctorId: string): Promise<CalendarSyncResult> {
    try {
      console.log(`🔄 Starting calendar sync for doctor ${doctorId}`);

      // Get doctor's calendar OAuth info
      const doctor = await Doctor.findById(doctorId);
      if (!doctor || !doctor.calendar?.oauth?.refreshToken) {
        throw new Error('Doctor not found or calendar not connected');
      }

      const { refreshToken, calendarId = 'primary' } = doctor.calendar.oauth;

      // Fetch events from Google Calendar
      const events = await this.fetchExistingEvents(
        refreshToken,
        calendarId,
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        doctorId
      );

      let newAppointments = 0;
      let updatedAppointments = 0;
      const errors: string[] = [];

      // Process each event
      for (const event of events) {
        try {
          if (!event.id) continue;

          // Check if appointment already exists
          const existingAppointment = await Appointment.findOne({
            'googleCalendarEventId': event.id,
            doctorId: doctorId
          });

          if (existingAppointment) {
            // Update existing appointment if needed
            const needsUpdate = this.appointmentNeedsUpdate(existingAppointment, event);
            if (needsUpdate) {
              await this.updateAppointmentFromGoogleEvent(existingAppointment, event);
              updatedAppointments++;
            }
          } else {
            // Create new appointment from Google event
            await this.createAppointmentFromGoogleEvent(event, doctorId);
            newAppointments++;
          }
        } catch (error) {
          const errorMsg = `Failed to process event ${event.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      // Update doctor's calendar sync info
      await Doctor.findByIdAndUpdate(doctorId, {
        'calendar.lastSync': new Date(),
        'calendar.nextSync': new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
      });

      const result: CalendarSyncResult = {
        totalEvents: events.length,
        newAppointments: newAppointments,
        updatedAppointments: updatedAppointments,
        errors: errors
      };

      console.log(`✅ Calendar sync completed for doctor ${doctorId}:`, result);

      // Log the sync operation
      await EventLog.create({
        id: uuidv4(),
        level: 'info',
        category: 'calendar',
        action: 'sync_completed',
        userId: doctorId,
        userType: 'doctor',
        resourceId: calendarId,
        resourceType: 'calendar',
        details: result
      });

      return result;
    } catch (error) {
      console.error('Error syncing existing appointments:', error);
      
      // Log the error
      await EventLog.create({
        id: uuidv4(),
        level: 'error',
        category: 'calendar',
        action: 'sync_failed',
        userId: doctorId,
        userType: 'doctor',
        resourceId: doctorId,
        resourceType: 'calendar',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      });

      throw new Error(`Failed to sync existing appointments: ${error}`);
    }
  }

  /**
   * Check if an appointment needs to be updated based on Google Calendar event
   */
  private static appointmentNeedsUpdate(appointment: any, event: GoogleCalendarEvent): boolean {
    const appointmentStart = new Date(appointment.startTime).toISOString();
    const appointmentEnd = new Date(appointment.endTime).toISOString();
    const eventStart = event.start.dateTime;
    const eventEnd = event.end.dateTime;

    return (
      appointmentStart !== eventStart ||
      appointmentEnd !== eventEnd ||
      appointment.title !== event.summary ||
      appointment.notes !== (event.description || '')
    );
  }

  /**
   * Create a new appointment from Google Calendar event
   */
  private static async createAppointmentFromGoogleEvent(event: GoogleCalendarEvent, doctorId: string): Promise<void> {
    const appointmentData = {
      id: uuidv4(),
      doctorId: doctorId,
      patientId: null, // Will be linked later if patient info is found
      title: event.summary,
      startTime: new Date(event.start.dateTime),
      endTime: new Date(event.end.dateTime),
      googleCalendarEventId: event.id,
      status: 'scheduled' as const,
      notes: event.description || '',
      method: 'in-person' as const,
      consultationDetails: {
        notes: event.description || '',
        diagnosis: '',
        treatment: '',
        prescription: ''
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await Appointment.create(appointmentData);
    console.log(`✅ Created appointment from Google event: ${event.summary}`);
  }

  /**
   * Update existing appointment from Google Calendar event
   */
  private static async updateAppointmentFromGoogleEvent(appointment: any, event: GoogleCalendarEvent): Promise<void> {
    const updates = {
      title: event.summary,
      startTime: new Date(event.start.dateTime),
      endTime: new Date(event.end.dateTime),
      notes: event.description || '',
      'consultationDetails.notes': event.description || '',
      updatedAt: new Date()
    };

    await Appointment.findByIdAndUpdate(appointment._id, updates);
    console.log(`✅ Updated appointment from Google event: ${event.summary}`);
  }
}
