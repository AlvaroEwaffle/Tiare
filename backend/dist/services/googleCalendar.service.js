"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleCalendarService = void 0;
const googleapis_1 = require("googleapis");
const models_1 = require("../models");
const uuid_1 = require("uuid");
class GoogleCalendarService {
    // Remove static readonly variables to ensure they are read at runtime
    /**
     * Create OAuth2 client for Google Calendar
     */
    static createOAuth2Client() {
        const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
        const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI;
        console.log('🔧 [createOAuth2Client] Environment variables check:', {
            GOOGLE_CALENDAR_CLIENT_ID: !!clientId,
            GOOGLE_CALENDAR_CLIENT_SECRET: !!clientSecret,
            GOOGLE_CALENDAR_REDIRECT_URI: !!redirectUri,
            CLIENT_ID_LENGTH: (clientId === null || clientId === void 0 ? void 0 : clientId.length) || 0,
            CLIENT_SECRET_LENGTH: (clientSecret === null || clientSecret === void 0 ? void 0 : clientSecret.length) || 0
        });
        if (!clientId || !clientSecret) {
            throw new Error('Google OAuth credentials not configured. Please check GOOGLE_CALENDAR_CLIENT_ID and GOOGLE_CALENDAR_CLIENT_SECRET');
        }
        return new googleapis_1.google.auth.OAuth2(clientId, clientSecret, redirectUri);
    }
    /**
     * Generate OAuth2 authorization URL
     */
    static generateAuthUrl(doctorId) {
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
    static exchangeCodeForTokens(code) {
        return __awaiter(this, void 0, void 0, function* () {
            const oauth2Client = this.createOAuth2Client();
            try {
                const { tokens } = yield oauth2Client.getToken(code);
                if (!tokens.access_token || !tokens.refresh_token) {
                    throw new Error('Failed to obtain required tokens');
                }
                return {
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token,
                    expiryDate: tokens.expiry_date || Date.now() + 3600000 // 1 hour default
                };
            }
            catch (error) {
                throw new Error(`Failed to exchange code for tokens: ${error}`);
            }
        });
    }
    /**
     * Create a new calendar event
     */
    static createEvent(refreshToken, calendarId, event, doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const oauth2Client = this.createOAuth2Client();
                oauth2Client.setCredentials({ refresh_token: refreshToken });
                const calendar = googleapis_1.google.calendar({ version: 'v3', auth: oauth2Client });
                const response = yield calendar.events.insert({
                    calendarId,
                    requestBody: event
                });
                const eventId = response.data.id;
                const htmlLink = response.data.htmlLink;
                if (!eventId) {
                    throw new Error('Failed to create calendar event');
                }
                // Log the event creation
                yield models_1.EventLog.create({
                    id: (0, uuid_1.v4)(),
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
            }
            catch (error) {
                throw new Error(`Failed to create calendar event: ${error}`);
            }
        });
    }
    /**
     * Update an existing calendar event
     */
    static updateEvent(refreshToken, calendarId, eventId, event, doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const oauth2Client = this.createOAuth2Client();
                oauth2Client.setCredentials({ refresh_token: refreshToken });
                const calendar = googleapis_1.google.calendar({ version: 'v3', auth: oauth2Client });
                yield calendar.events.update({
                    calendarId,
                    eventId,
                    requestBody: event
                });
                // Log the event update
                yield models_1.EventLog.create({
                    id: (0, uuid_1.v4)(),
                    level: 'info',
                    category: 'calendar',
                    action: 'event_updated',
                    userId: doctorId,
                    userType: 'doctor',
                    resourceId: eventId,
                    resourceType: 'calendar_event',
                    details: { summary: event.summary }
                });
            }
            catch (error) {
                throw new Error(`Failed to update calendar event: ${error}`);
            }
        });
    }
    /**
     * Delete a calendar event
     */
    static deleteEvent(refreshToken, calendarId, eventId, doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const oauth2Client = this.createOAuth2Client();
                oauth2Client.setCredentials({ refresh_token: refreshToken });
                const calendar = googleapis_1.google.calendar({ version: 'v3', auth: oauth2Client });
                yield calendar.events.delete({
                    calendarId,
                    eventId
                });
                // Log the event deletion
                yield models_1.EventLog.create({
                    id: (0, uuid_1.v4)(),
                    level: 'info',
                    category: 'calendar',
                    action: 'event_deleted',
                    userId: doctorId,
                    userType: 'doctor',
                    resourceId: eventId,
                    resourceType: 'calendar_event',
                    details: {}
                });
            }
            catch (error) {
                throw new Error(`Failed to delete calendar event: ${error}`);
            }
        });
    }
    /**
     * Check if a time slot is available in Google Calendar
     */
    static checkAvailability(refreshToken, calendarId, startTime, endTime, doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('🔍 [GOOGLE CALENDAR] Checking availability:', { startTime, endTime });
                const oauth2Client = this.createOAuth2Client();
                oauth2Client.setCredentials({ refresh_token: refreshToken });
                const calendar = googleapis_1.google.calendar({ version: 'v3', auth: oauth2Client });
                // Query for events that overlap with the requested time slot
                const response = yield calendar.events.list({
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
                    console.log('🔍 [GOOGLE CALENDAR] Conflicting events:', conflictingEvents.map(e => {
                        var _a, _b;
                        return ({
                            summary: e.summary,
                            start: (_a = e.start) === null || _a === void 0 ? void 0 : _a.dateTime,
                            end: (_b = e.end) === null || _b === void 0 ? void 0 : _b.dateTime
                        });
                    }));
                }
                // Log the availability check
                yield models_1.EventLog.create({
                    id: (0, uuid_1.v4)(),
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
            }
            catch (error) {
                console.error('❌ [GOOGLE CALENDAR] Error checking availability:', error);
                throw new Error(`Failed to check Google Calendar availability: ${error}`);
            }
        });
    }
    /**
     * Get calendar availability for a specific time range
     */
    static getAvailability(refreshToken, calendarId, startTime, endTime, doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const oauth2Client = this.createOAuth2Client();
                oauth2Client.setCredentials({ refresh_token: refreshToken });
                const calendar = googleapis_1.google.calendar({ version: 'v3', auth: oauth2Client });
                const response = yield calendar.freebusy.query({
                    requestBody: {
                        timeMin: startTime,
                        timeMax: endTime,
                        items: [{ id: calendarId }]
                    }
                });
                const busy = ((_b = (_a = response.data.calendars) === null || _a === void 0 ? void 0 : _a[calendarId]) === null || _b === void 0 ? void 0 : _b.busy) || [];
                // Convert busy times to availability slots
                const availability = [];
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
            }
            catch (error) {
                throw new Error(`Failed to get calendar availability: ${error}`);
            }
        });
    }
    /**
     * Refresh access token using refresh token
     */
    static refreshAccessToken(refreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const oauth2Client = this.createOAuth2Client();
                oauth2Client.setCredentials({ refresh_token: refreshToken });
                const { credentials } = yield oauth2Client.refreshAccessToken();
                if (!credentials.access_token) {
                    throw new Error('Failed to refresh access token');
                }
                return {
                    accessToken: credentials.access_token,
                    expiryDate: credentials.expiry_date || Date.now() + 3600000
                };
            }
            catch (error) {
                throw new Error(`Failed to refresh access token: ${error}`);
            }
        });
    }
    /**
     * Get existing events from Google Calendar
     */
    static fetchExistingEvents(refreshToken_1, calendarId_1) {
        return __awaiter(this, arguments, void 0, function* (refreshToken, calendarId, timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        timeMax = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        doctorId) {
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
                const calendar = googleapis_1.google.calendar({ version: 'v3', auth: oauth2Client });
                console.log(`📅 [fetchExistingEvents] Fetching events from calendar ${calendarId} for doctor ${doctorId}`);
                console.log(`⏰ [fetchExistingEvents] Time range: ${timeMin.toISOString()} to ${timeMax.toISOString()}`);
                const response = yield calendar.events.list({
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
                    yield models_1.EventLog.create({
                        id: (0, uuid_1.v4)(),
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
                }
                catch (logError) {
                    console.warn(`⚠️ [fetchExistingEvents] Could not log to EventLog:`, logError);
                    // Continue execution even if logging fails
                }
                const mappedEvents = events
                    .filter(event => event.id) // Filter out events without ID
                    .map(event => {
                    var _a, _b, _c, _d, _e, _f, _g, _h;
                    return ({
                        id: event.id,
                        summary: event.summary || 'Sin título',
                        description: event.description || undefined,
                        start: {
                            dateTime: ((_a = event.start) === null || _a === void 0 ? void 0 : _a.dateTime) || ((_b = event.start) === null || _b === void 0 ? void 0 : _b.date) || '',
                            timeZone: ((_c = event.start) === null || _c === void 0 ? void 0 : _c.timeZone) || 'UTC' // Default to UTC for consistency
                        },
                        end: {
                            dateTime: ((_d = event.end) === null || _d === void 0 ? void 0 : _d.dateTime) || ((_e = event.end) === null || _e === void 0 ? void 0 : _e.date) || '',
                            timeZone: ((_f = event.end) === null || _f === void 0 ? void 0 : _f.timeZone) || 'UTC' // Default to UTC for consistency
                        },
                        attendees: ((_g = event.attendees) === null || _g === void 0 ? void 0 : _g.map(attendee => ({
                            email: attendee.email || '',
                            displayName: attendee.displayName || undefined
                        }))) || [],
                        reminders: event.reminders ? {
                            useDefault: event.reminders.useDefault || false,
                            overrides: ((_h = event.reminders.overrides) === null || _h === void 0 ? void 0 : _h.map(override => ({
                                method: override.method || 'popup',
                                minutes: override.minutes || 0
                            }))) || []
                        } : undefined
                    });
                });
                console.log(`✅ [fetchExistingEvents] Successfully mapped ${mappedEvents.length} events`);
                return mappedEvents;
            }
            catch (error) {
                console.error('❌ [fetchExistingEvents] Error fetching existing events:', error);
                // Try to log the error, but don't fail if EventLog is not available
                try {
                    yield models_1.EventLog.create({
                        id: (0, uuid_1.v4)(),
                        level: 'error',
                        category: 'calendar',
                        action: 'events_fetch_failed',
                        userId: doctorId,
                        userType: 'doctor',
                        resourceId: calendarId,
                        resourceType: 'calendar',
                        details: { error: error instanceof Error ? error.message : 'Unknown error' }
                    });
                }
                catch (logError) {
                    console.warn(`⚠️ [fetchExistingEvents] Could not log error to EventLog:`, logError);
                }
                throw new Error(`Failed to fetch existing events: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    /**
     * Sync existing Google Calendar events with local appointments
     */
    static syncExistingAppointments(doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                console.log(`🔄 Starting calendar sync for doctor ${doctorId}`);
                // Get doctor's calendar OAuth info
                const doctor = yield models_1.Doctor.findById(doctorId);
                if (!doctor || !((_b = (_a = doctor.calendar) === null || _a === void 0 ? void 0 : _a.oauth) === null || _b === void 0 ? void 0 : _b.refreshToken)) {
                    throw new Error('Doctor not found or calendar not connected');
                }
                const { refreshToken, calendarId = 'primary' } = doctor.calendar.oauth;
                // Fetch events from Google Calendar
                const events = yield this.fetchExistingEvents(refreshToken, calendarId, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
                doctorId);
                let newAppointments = 0;
                let updatedAppointments = 0;
                const errors = [];
                // Process each event
                for (const event of events) {
                    try {
                        if (!event.id)
                            continue;
                        // Check if appointment already exists
                        const existingAppointment = yield models_1.Appointment.findOne({
                            'googleCalendarEventId': event.id,
                            doctorId: doctorId
                        });
                        if (existingAppointment) {
                            // Update existing appointment if needed
                            const needsUpdate = this.appointmentNeedsUpdate(existingAppointment, event);
                            if (needsUpdate) {
                                yield this.updateAppointmentFromGoogleEvent(existingAppointment, event);
                                updatedAppointments++;
                            }
                        }
                        else {
                            // Create new appointment from Google event
                            yield this.createAppointmentFromGoogleEvent(event, doctorId);
                            newAppointments++;
                        }
                    }
                    catch (error) {
                        const errorMsg = `Failed to process event ${event.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                        console.error(errorMsg);
                        errors.push(errorMsg);
                    }
                }
                // Update doctor's calendar sync info
                yield models_1.Doctor.findByIdAndUpdate(doctorId, {
                    'calendar.lastSync': new Date(),
                    'calendar.nextSync': new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
                });
                const result = {
                    totalEvents: events.length,
                    newAppointments: newAppointments,
                    updatedAppointments: updatedAppointments,
                    errors: errors
                };
                console.log(`✅ Calendar sync completed for doctor ${doctorId}:`, result);
                // Log the sync operation
                yield models_1.EventLog.create({
                    id: (0, uuid_1.v4)(),
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
            }
            catch (error) {
                console.error('Error syncing existing appointments:', error);
                // Log the error
                yield models_1.EventLog.create({
                    id: (0, uuid_1.v4)(),
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
        });
    }
    /**
     * Check if an appointment needs to be updated based on Google Calendar event
     */
    static appointmentNeedsUpdate(appointment, event) {
        const appointmentStart = new Date(appointment.startTime).toISOString();
        const appointmentEnd = new Date(appointment.endTime).toISOString();
        const eventStart = event.start.dateTime;
        const eventEnd = event.end.dateTime;
        return (appointmentStart !== eventStart ||
            appointmentEnd !== eventEnd ||
            appointment.title !== event.summary ||
            appointment.notes !== (event.description || ''));
    }
    /**
     * Create a new appointment from Google Calendar event
     */
    static createAppointmentFromGoogleEvent(event, doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            const appointmentData = {
                id: (0, uuid_1.v4)(),
                doctorId: doctorId,
                patientId: null, // Will be linked later if patient info is found
                title: event.summary,
                startTime: new Date(event.start.dateTime),
                endTime: new Date(event.end.dateTime),
                googleCalendarEventId: event.id,
                status: 'scheduled',
                notes: event.description || '',
                method: 'in-person',
                consultationDetails: {
                    notes: event.description || '',
                    diagnosis: '',
                    treatment: '',
                    prescription: ''
                },
                createdAt: new Date(),
                updatedAt: new Date()
            };
            yield models_1.Appointment.create(appointmentData);
            console.log(`✅ Created appointment from Google event: ${event.summary}`);
        });
    }
    /**
     * Update existing appointment from Google Calendar event
     */
    static updateAppointmentFromGoogleEvent(appointment, event) {
        return __awaiter(this, void 0, void 0, function* () {
            const updates = {
                title: event.summary,
                startTime: new Date(event.start.dateTime),
                endTime: new Date(event.end.dateTime),
                notes: event.description || '',
                'consultationDetails.notes': event.description || '',
                updatedAt: new Date()
            };
            yield models_1.Appointment.findByIdAndUpdate(appointment._id, updates);
            console.log(`✅ Updated appointment from Google event: ${event.summary}`);
        });
    }
}
exports.GoogleCalendarService = GoogleCalendarService;
