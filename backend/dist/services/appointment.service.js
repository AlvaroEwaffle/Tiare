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
exports.AppointmentService = void 0;
const uuid_1 = require("uuid");
const models_1 = require("../models");
const googleCalendar_service_1 = require("./googleCalendar.service");
const whatsapp_service_1 = require("./whatsapp.service");
const timezone_service_1 = require("./timezone.service");
class AppointmentService {
    /**
     * Create a new appointment
     */
    static createAppointment(appointmentData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            try {
                console.log('🔧 [AppointmentService] Request received to create appointment:', {
                    patientId: appointmentData.patientId,
                    dateTime: appointmentData.dateTime,
                    duration: appointmentData.duration,
                    type: appointmentData.type,
                    notes: appointmentData.notes
                });
                // First, find the patient to get their doctorId
                console.log('🔍 [AppointmentService] Searching for patient with ID:', appointmentData.patientId);
                const patient = yield models_1.Patient.findOne({ id: appointmentData.patientId, isActive: true });
                if (!patient) {
                    console.error('❌ [AppointmentService] Patient not found with ID:', appointmentData.patientId);
                    throw new Error('Patient not found');
                }
                console.log('✅ [AppointmentService] Patient found:', {
                    id: patient.id,
                    name: patient.name,
                    doctorId: patient.doctorId
                });
                // Then find the doctor using the patient's doctorId
                console.log('🔍 [AppointmentService] Searching for doctor with ID:', patient.doctorId);
                const doctor = yield models_1.Doctor.findOne({ id: patient.doctorId, isActive: true });
                if (!doctor) {
                    console.error('❌ [AppointmentService] Doctor not found for patient:', patient.doctorId);
                    throw new Error('Doctor not found for the patient');
                }
                console.log('✅ [AppointmentService] Doctor found:', {
                    id: doctor.id,
                    name: doctor.name,
                    specialization: doctor.specialization
                });
                // Check if the time slot is available
                console.log('🔍 [AppointmentService] Checking availability for:', {
                    doctorId: doctor.id,
                    dateTime: appointmentData.dateTime,
                    duration: appointmentData.duration
                });
                const isAvailable = yield this.checkAvailability(doctor.id, appointmentData.dateTime, appointmentData.duration);
                if (!isAvailable) {
                    console.error('❌ [AppointmentService] Time slot not available:', {
                        dateTime: appointmentData.dateTime,
                        duration: appointmentData.duration
                    });
                    throw new Error('Time slot is not available');
                }
                console.log('✅ [AppointmentService] Time slot is available');
                // Create appointment - ALWAYS store dates in UTC
                console.log('➕ [AppointmentService] Creating appointment in database (UTC)...');
                // Convert appointment dateTime to UTC if it's not already
                const utcDateTime = timezone_service_1.TimezoneService.convertToUTC(appointmentData.dateTime, doctor.timezone || 'America/Santiago');
                console.log('🕐 [AppointmentService] Date conversion:', {
                    original: appointmentData.dateTime.toISOString(),
                    doctorTimezone: doctor.timezone || 'America/Santiago',
                    utc: utcDateTime.toISOString()
                });
                const appointment = new models_1.Appointment(Object.assign(Object.assign({ id: (0, uuid_1.v4)(), doctorId: doctor.id, title: `Consulta con ${patient.name}`, timezone: doctor.timezone || 'America/Santiago' }, appointmentData), { dateTime: utcDateTime // Override with UTC date
                 }));
                yield appointment.save();
                console.log('✅ [AppointmentService] Appointment saved to database with ID:', appointment.id);
                // Create Google Calendar event if doctor has calendar connected
                if (((_b = (_a = doctor.calendar) === null || _a === void 0 ? void 0 : _a.oauth) === null || _b === void 0 ? void 0 : _b.refreshToken) && ((_d = (_c = doctor.calendar) === null || _c === void 0 ? void 0 : _c.oauth) === null || _d === void 0 ? void 0 : _d.calendarId)) {
                    console.log('📅 [AppointmentService] Doctor has Google Calendar connected, creating event...');
                    try {
                        // Use UTC dates for Google Calendar (Google Calendar API expects UTC)
                        const event = {
                            summary: `Consulta con ${patient.name}`,
                            description: `Tipo: ${appointmentData.type}\nNotas: ${appointmentData.notes || 'Sin notas'}`,
                            start: {
                                dateTime: utcDateTime.toISOString(), // Use UTC date
                                timeZone: 'UTC' // Always use UTC for Google Calendar API
                            },
                            end: {
                                dateTime: new Date(utcDateTime.getTime() + appointmentData.duration * 60000).toISOString(), // Use UTC date
                                timeZone: 'UTC' // Always use UTC for Google Calendar API
                            },
                            reminders: {
                                useDefault: false,
                                overrides: [
                                    { method: 'popup', minutes: 24 * 60 }, // 24 hours before
                                    { method: 'popup', minutes: 2 * 60 } // 2 hours before
                                ]
                            }
                        };
                        const { eventId } = yield googleCalendar_service_1.GoogleCalendarService.createEvent(doctor.calendar.oauth.refreshToken, doctor.calendar.oauth.calendarId, event, doctor.id);
                        appointment.googleEventId = eventId;
                        appointment.googleCalendarId = doctor.calendar.oauth.calendarId;
                        yield appointment.save();
                        console.log('✅ [AppointmentService] Google Calendar event created with ID:', eventId);
                    }
                    catch (error) {
                        console.error('❌ [AppointmentService] Failed to create Google Calendar event:', error);
                        // Don't fail the appointment creation if calendar sync fails
                    }
                }
                else {
                    console.log('ℹ️ [AppointmentService] Doctor does not have Google Calendar connected');
                }
                // Send confirmation to patient via WhatsApp if enabled
                if ((_e = patient.communicationPreferences) === null || _e === void 0 ? void 0 : _e.whatsappEnabled) {
                    console.log('📱 [AppointmentService] Patient has WhatsApp enabled, sending confirmation...');
                    try {
                        yield whatsapp_service_1.WhatsAppService.sendAppointmentConfirmation(patient.phone, {
                            date: appointmentData.dateTime.toLocaleDateString('es-CL'),
                            time: appointmentData.dateTime.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
                            type: appointmentData.type,
                            doctorName: doctor.name,
                            notes: appointmentData.notes
                        }, doctor.id);
                        console.log('✅ [AppointmentService] WhatsApp confirmation sent successfully');
                    }
                    catch (error) {
                        console.error('❌ [AppointmentService] Failed to send WhatsApp confirmation:', error);
                    }
                }
                else {
                    console.log('ℹ️ [AppointmentService] Patient does not have WhatsApp enabled');
                }
                // Log the event
                console.log('📝 [AppointmentService] Creating event log...');
                yield models_1.EventLog.create({
                    id: (0, uuid_1.v4)(),
                    level: 'info',
                    category: 'appointment',
                    action: 'appointment_created',
                    userId: doctor.id,
                    userType: 'doctor',
                    resourceId: appointment.id,
                    resourceType: 'appointment',
                    details: {
                        patientName: patient.name,
                        dateTime: appointmentData.dateTime,
                        type: appointmentData.type
                    }
                });
                console.log('✅ [AppointmentService] Event log created successfully');
                console.log('🎉 [AppointmentService] Appointment creation completed successfully for:', {
                    appointmentId: appointment.id,
                    patientName: patient.name,
                    doctorName: doctor.name,
                    dateTime: appointmentData.dateTime
                });
                return yield this.getAppointmentWithDetails(appointment.id);
            }
            catch (error) {
                console.error('❌ [AppointmentService] Error creating appointment:', error);
                throw new Error(`Failed to create appointment: ${error}`);
            }
        });
    }
    /**
     * Get appointment with patient and doctor details
     */
    static getAppointmentWithDetails(appointmentId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const appointment = yield models_1.Appointment.findOne({ id: appointmentId });
                if (!appointment) {
                    throw new Error('Appointment not found');
                }
                const [patient, doctor] = yield Promise.all([
                    models_1.Patient.findOne({ id: appointment.patientId }),
                    models_1.Doctor.findOne({ id: appointment.doctorId })
                ]);
                if (!patient || !doctor) {
                    throw new Error('Patient or doctor not found');
                }
                const result = {
                    id: appointment.id,
                    doctorId: appointment.doctorId,
                    patientId: appointment.patientId,
                    dateTime: appointment.dateTime,
                    duration: appointment.duration,
                    type: appointment.type,
                    status: appointment.status,
                    notes: (_a = appointment.consultationDetails) === null || _a === void 0 ? void 0 : _a.notes,
                    consultationDetails: appointment.consultationDetails,
                    googleEventId: appointment.googleEventId,
                    timezone: appointment.timezone, // Include timezone from appointment
                    reminders: appointment.reminders,
                    cancellationReason: appointment.cancellationReason,
                    cancellationPenalty: appointment.cancellationPenalty,
                    patientName: patient.name,
                    patientPhone: patient.phone,
                    doctorName: doctor.name,
                    doctorSpecialization: doctor.specialization,
                    createdAt: appointment.createdAt,
                    updatedAt: appointment.updatedAt
                };
                console.log('🕐 [AppointmentService] Appointment details retrieved:', {
                    id: result.id,
                    dateTime: result.dateTime.toISOString(),
                    timezone: result.timezone,
                    storageFormat: 'UTC'
                });
                return result;
            }
            catch (error) {
                throw new Error(`Failed to get appointment details: ${error}`);
            }
        });
    }
    /**
     * Get appointments for a doctor with Google Calendar as source of truth
     */
    static getAppointmentsByDoctor(doctorId_1, startDate_1, endDate_1, status_1) {
        return __awaiter(this, arguments, void 0, function* (doctorId, startDate, endDate, status, page = 1, limit = 20, patientId) {
            try {
                console.log('🔍 [AppointmentService] Getting appointments for doctor:', doctorId, 'with Google Calendar as source of truth');
                // First, try to get appointments from Google Calendar (source of truth)
                try {
                    const googleCalendarAppointments = yield this.getAppointmentsFromGoogleCalendar(doctorId, startDate, endDate, status, patientId);
                    if (googleCalendarAppointments && googleCalendarAppointments.length > 0) {
                        console.log('✅ [AppointmentService] Successfully retrieved', googleCalendarAppointments.length, 'appointments from Google Calendar');
                        console.log('🕐 [AppointmentService] All dates from Google Calendar are in UTC');
                        // Apply pagination to Google Calendar results
                        const startIndex = (page - 1) * limit;
                        const endIndex = startIndex + limit;
                        const paginatedAppointments = googleCalendarAppointments.slice(startIndex, endIndex);
                        return {
                            appointments: paginatedAppointments,
                            total: googleCalendarAppointments.length,
                            page,
                            totalPages: Math.ceil(googleCalendarAppointments.length / limit)
                        };
                    }
                }
                catch (googleError) {
                    console.warn('⚠️ [AppointmentService] Google Calendar unavailable, falling back to local database:', googleError);
                }
                // Fallback to local database if Google Calendar is unavailable
                console.log('🔄 [AppointmentService] Falling back to local database for appointments');
                console.log('🕐 [AppointmentService] Local database dates are already in UTC');
                const skip = (page - 1) * limit;
                const query = { doctorId };
                if (startDate && endDate) {
                    query.dateTime = { $gte: startDate, $lte: endDate };
                }
                else if (startDate) {
                    query.dateTime = { $gte: startDate };
                }
                else if (endDate) {
                    query.dateTime = { $lte: endDate };
                }
                if (status) {
                    query.status = status;
                }
                if (patientId) {
                    query.patientId = patientId;
                }
                console.log('🔍 [AppointmentService] Local database query:', JSON.stringify(query, null, 2));
                const [appointments, total] = yield Promise.all([
                    models_1.Appointment.find(query)
                        .sort({ dateTime: 1 })
                        .skip(skip)
                        .limit(limit)
                        .lean(),
                    models_1.Appointment.countDocuments(query)
                ]);
                const totalPages = Math.ceil(total / limit);
                // Get details for each appointment
                const appointmentsWithDetails = yield Promise.all(appointments.map(appointment => this.getAppointmentWithDetails(appointment.id)));
                console.log('✅ [AppointmentService] Retrieved', appointmentsWithDetails.length, 'appointments from local database');
                console.log('🌍 [AppointmentService] Database fallback summary:', {
                    totalAppointments: total,
                    returnedAppointments: appointmentsWithDetails.length,
                    storageFormat: 'UTC',
                    query: query
                });
                return {
                    appointments: appointmentsWithDetails,
                    total,
                    page,
                    totalPages
                };
            }
            catch (error) {
                throw new Error(`Failed to get appointments: ${error}`);
            }
        });
    }
    /**
     * Get appointments from Google Calendar as source of truth
     */
    static getAppointmentsFromGoogleCalendar(doctorId, startDate, endDate, status, patientId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            try {
                console.log('🔍 [AppointmentService] Fetching appointments from Google Calendar for doctor:', doctorId);
                // Get doctor's Google Calendar credentials
                const doctor = yield models_1.Doctor.findOne({ id: doctorId, isActive: true });
                console.log('🌍 [AppointmentService] Doctor timezone:', (doctor === null || doctor === void 0 ? void 0 : doctor.timezone) || 'America/Santiago');
                console.log('🔍 [AppointmentService] Doctor lookup result:', {
                    found: !!doctor,
                    doctorId: doctorId,
                    doctorActive: doctor === null || doctor === void 0 ? void 0 : doctor.isActive,
                    hasCalendar: !!(doctor === null || doctor === void 0 ? void 0 : doctor.calendar),
                    hasOAuth: !!((_a = doctor === null || doctor === void 0 ? void 0 : doctor.calendar) === null || _a === void 0 ? void 0 : _a.oauth),
                    hasRefreshToken: !!((_c = (_b = doctor === null || doctor === void 0 ? void 0 : doctor.calendar) === null || _b === void 0 ? void 0 : _b.oauth) === null || _c === void 0 ? void 0 : _c.refreshToken),
                    calendarId: (_e = (_d = doctor === null || doctor === void 0 ? void 0 : doctor.calendar) === null || _d === void 0 ? void 0 : _d.oauth) === null || _e === void 0 ? void 0 : _e.calendarId
                });
                if (!doctor) {
                    console.error('❌ [AppointmentService] Doctor not found with ID:', doctorId);
                    return [];
                }
                if (!doctor.isActive) {
                    console.error('❌ [AppointmentService] Doctor is not active:', doctorId);
                    return [];
                }
                if (!((_g = (_f = doctor.calendar) === null || _f === void 0 ? void 0 : _f.oauth) === null || _g === void 0 ? void 0 : _g.refreshToken)) {
                    console.error('❌ [AppointmentService] Doctor has no Google Calendar OAuth refresh token:', doctorId);
                    return [];
                }
                // Set time range for Google Calendar query
                const timeMin = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
                const timeMax = endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days from now
                // Fetch events from Google Calendar
                console.log('🔍 [AppointmentService] Attempting to fetch events from Google Calendar with:', {
                    refreshToken: doctor.calendar.oauth.refreshToken ? '***present***' : 'missing',
                    calendarId: doctor.calendar.oauth.calendarId || 'primary',
                    timeMin: timeMin.toISOString(),
                    timeMax: timeMax.toISOString()
                });
                const googleEvents = yield googleCalendar_service_1.GoogleCalendarService.fetchExistingEvents(doctor.calendar.oauth.refreshToken, doctor.calendar.oauth.calendarId || 'primary', timeMin, timeMax, doctorId);
                console.log('✅ [AppointmentService] Retrieved', googleEvents.length, 'events from Google Calendar');
                if (googleEvents.length === 0) {
                    console.log('ℹ️ [AppointmentService] No events found in Google Calendar for the specified time range');
                }
                else {
                    // Log first few events to debug
                    console.log('🔍 [AppointmentService] Sample Google Calendar events:', googleEvents.slice(0, 3).map(event => ({
                        id: event.id,
                        summary: event.summary,
                        start: event.start.dateTime,
                        end: event.end.dateTime,
                        timezone: event.start.timeZone || 'UTC'
                    })));
                }
                // Convert Google Calendar events to AppointmentWithDetails format
                const appointments = [];
                for (const event of googleEvents) {
                    try {
                        // Try to find corresponding local appointment for additional details
                        const localAppointment = yield models_1.Appointment.findOne({
                            googleEventId: event.id,
                            doctorId: doctorId
                        });
                        // Create appointment object with Google Calendar data
                        // Google Calendar events come with UTC dates, so we keep them as UTC
                        const appointment = {
                            id: (localAppointment === null || localAppointment === void 0 ? void 0 : localAppointment.id) || event.id || (0, uuid_1.v4)(),
                            doctorId: doctorId,
                            patientId: (localAppointment === null || localAppointment === void 0 ? void 0 : localAppointment.patientId) || 'unknown',
                            dateTime: new Date(event.start.dateTime), // Keep as UTC from Google Calendar
                            duration: this.calculateDuration(event.start.dateTime, event.end.dateTime),
                            type: (localAppointment === null || localAppointment === void 0 ? void 0 : localAppointment.type) || 'remote',
                            status: (localAppointment === null || localAppointment === void 0 ? void 0 : localAppointment.status) || 'scheduled',
                            title: event.summary || (localAppointment === null || localAppointment === void 0 ? void 0 : localAppointment.title) || 'Consulta sin título', // PRIORIDAD: Google Calendar summary
                            notes: ((_h = localAppointment === null || localAppointment === void 0 ? void 0 : localAppointment.consultationDetails) === null || _h === void 0 ? void 0 : _h.notes) || event.description || '',
                            googleEventId: event.id || undefined,
                            timezone: doctor.timezone || 'America/Santiago', // Include doctor's timezone
                            reminders: (localAppointment === null || localAppointment === void 0 ? void 0 : localAppointment.reminders) || [],
                            patientName: (localAppointment === null || localAppointment === void 0 ? void 0 : localAppointment.patientId) ? yield this.getPatientName(localAppointment.patientId) : 'Unknown Patient',
                            patientPhone: (localAppointment === null || localAppointment === void 0 ? void 0 : localAppointment.patientId) ? yield this.getPatientPhone(localAppointment.patientId) : '',
                            doctorName: doctor.name || 'Unknown Doctor',
                            doctorSpecialization: doctor.specialization || '',
                            createdAt: (localAppointment === null || localAppointment === void 0 ? void 0 : localAppointment.createdAt) || new Date(),
                            updatedAt: new Date()
                        };
                        // Log the title assignment for debugging
                        console.log('🏷️ [AppointmentService] Title assignment for event:', {
                            eventId: event.id,
                            googleSummary: event.summary,
                            localTitle: localAppointment === null || localAppointment === void 0 ? void 0 : localAppointment.title,
                            finalTitle: appointment.title,
                            timezone: appointment.timezone
                        });
                        // Apply status filter if specified
                        if (status && appointment.status !== status) {
                            continue;
                        }
                        // Apply patient filter if specified
                        if (patientId && appointment.patientId !== patientId) {
                            continue;
                        }
                        appointments.push(appointment);
                    }
                    catch (eventError) {
                        console.warn('⚠️ [AppointmentService] Error processing Google Calendar event:', event.id, eventError);
                        continue;
                    }
                }
                // Sort by dateTime
                appointments.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
                console.log('✅ [AppointmentService] Successfully converted', googleEvents.length, 'Google Calendar events to appointments');
                console.log('🕐 [AppointmentService] All dates are stored in UTC, doctor timezone:', doctor.timezone || 'America/Santiago');
                console.log('🌍 [AppointmentService] Timezone conversion summary:', {
                    totalEvents: googleEvents.length,
                    doctorTimezone: doctor.timezone || 'America/Santiago',
                    storageFormat: 'UTC',
                    conversionMethod: 'Google Calendar events kept as UTC'
                });
                return appointments;
            }
            catch (error) {
                console.error('❌ [AppointmentService] Error fetching appointments from Google Calendar:', error);
                throw error;
            }
        });
    }
    /**
     * Calculate duration in minutes between two date strings
     */
    static calculateDuration(startDateTime, endDateTime) {
        const start = new Date(startDateTime);
        const end = new Date(endDateTime);
        return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    }
    /**
     * Get patient name by ID
     */
    static getPatientName(patientId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const patient = yield models_1.Patient.findOne({ id: patientId, isActive: true });
                return (patient === null || patient === void 0 ? void 0 : patient.name) || 'Unknown Patient';
            }
            catch (error) {
                return 'Unknown Patient';
            }
        });
    }
    /**
     * Get patient phone by ID
     */
    static getPatientPhone(patientId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const patient = yield models_1.Patient.findOne({ id: patientId, isActive: true });
                return (patient === null || patient === void 0 ? void 0 : patient.phone) || '';
            }
            catch (error) {
                return '';
            }
        });
    }
    /**
     * Get appointments for a patient
     */
    static getAppointmentsByPatient(patientId_1, doctorId_1) {
        return __awaiter(this, arguments, void 0, function* (patientId, doctorId, page = 1, limit = 20) {
            try {
                const skip = (page - 1) * limit;
                const [appointments, total] = yield Promise.all([
                    models_1.Appointment.find({ patientId, doctorId })
                        .sort({ dateTime: -1 })
                        .skip(skip)
                        .limit(limit)
                        .lean(),
                    models_1.Appointment.countDocuments({ patientId, doctorId })
                ]);
                const totalPages = Math.ceil(total / limit);
                // Get details for each appointment
                const appointmentsWithDetails = yield Promise.all(appointments.map(appointment => this.getAppointmentWithDetails(appointment.id)));
                console.log('🕐 [AppointmentService] Retrieved', appointmentsWithDetails.length, 'appointments from database (all dates in UTC)');
                console.log('🌍 [AppointmentService] Patient appointments summary:', {
                    patientId: patientId,
                    totalAppointments: total,
                    returnedAppointments: appointmentsWithDetails.length,
                    storageFormat: 'UTC'
                });
                return {
                    appointments: appointmentsWithDetails,
                    total,
                    page,
                    totalPages
                };
            }
            catch (error) {
                throw new Error(`Failed to get patient appointments: ${error}`);
            }
        });
    }
    /**
     * Update appointment
     */
    static updateAppointment(appointmentId, doctorId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const appointment = yield models_1.Appointment.findOne({ id: appointmentId, doctorId });
                if (!appointment) {
                    throw new Error('Appointment not found');
                }
                // Update fields
                if (updateData.dateTime) {
                    // Convert to UTC if updating dateTime
                    const doctor = yield models_1.Doctor.findOne({ id: doctorId });
                    const doctorTimezone = (doctor === null || doctor === void 0 ? void 0 : doctor.timezone) || 'America/Santiago';
                    appointment.dateTime = timezone_service_1.TimezoneService.convertToUTC(updateData.dateTime, doctorTimezone);
                    appointment.timezone = doctorTimezone; // Update timezone
                }
                if (updateData.duration)
                    appointment.duration = updateData.duration;
                if (updateData.type)
                    appointment.type = updateData.type;
                if (updateData.status)
                    appointment.status = updateData.status;
                // Update consultation details
                if (updateData.consultationDetails) {
                    if (!appointment.consultationDetails) {
                        appointment.consultationDetails = {
                            type: appointment.type,
                            duration: appointment.duration,
                            price: 0, // Default price, should be updated
                            notes: undefined,
                            diagnosis: undefined,
                            prescription: undefined,
                            nextAppointment: undefined
                        };
                    }
                    Object.assign(appointment.consultationDetails, updateData.consultationDetails);
                }
                yield appointment.save();
                // Update Google Calendar event if exists
                if (appointment.googleEventId && appointment.googleCalendarId) {
                    try {
                        const doctor = yield models_1.Doctor.findOne({ id: doctorId });
                        if (doctor === null || doctor === void 0 ? void 0 : doctor.googleRefreshToken) {
                            const event = {
                                summary: `Consulta con ${(_a = (yield models_1.Patient.findOne({ id: appointment.patientId }))) === null || _a === void 0 ? void 0 : _a.name}`,
                                description: `Tipo: ${appointment.type}\nNotas: ${((_b = appointment.consultationDetails) === null || _b === void 0 ? void 0 : _b.notes) || 'Sin notas'}`,
                                start: {
                                    dateTime: appointment.dateTime.toISOString(), // Already in UTC
                                    timeZone: 'UTC' // Always use UTC for Google Calendar API
                                },
                                end: {
                                    dateTime: new Date(appointment.dateTime.getTime() + appointment.duration * 60000).toISOString(), // Already in UTC
                                    timeZone: 'UTC' // Always use UTC for Google Calendar API
                                }
                            };
                            yield googleCalendar_service_1.GoogleCalendarService.updateEvent(doctor.googleRefreshToken, appointment.googleCalendarId, appointment.googleEventId, event, doctor.id);
                        }
                    }
                    catch (error) {
                        console.error('Failed to update Google Calendar event:', error);
                    }
                }
                // Log the event
                yield models_1.EventLog.create({
                    id: (0, uuid_1.v4)(),
                    level: 'info',
                    category: 'appointment',
                    action: 'appointment_updated',
                    userId: doctorId,
                    userType: 'doctor',
                    resourceId: appointmentId,
                    resourceType: 'appointment',
                    details: { updatedFields: Object.keys(updateData) }
                });
                return yield this.getAppointmentWithDetails(appointmentId);
            }
            catch (error) {
                throw new Error(`Failed to update appointment: ${error}`);
            }
        });
    }
    /**
     * Cancel appointment
     */
    static cancelAppointment(appointmentId, doctorId, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const appointment = yield models_1.Appointment.findOne({ id: appointmentId, doctorId });
                if (!appointment) {
                    throw new Error('Appointment not found');
                }
                if (appointment.status === 'cancelled') {
                    throw new Error('Appointment is already cancelled');
                }
                // Check cancellation policy
                const doctor = yield models_1.Doctor.findOne({ id: doctorId });
                if (doctor) {
                    const hoursUntilAppointment = (appointment.dateTime.getTime() - Date.now()) / (1000 * 60 * 60);
                    const policyHours = doctor.practiceSettings.cancellationPolicy.hoursNotice;
                    if (hoursUntilAppointment < policyHours) {
                        const penaltyPercentage = doctor.practiceSettings.cancellationPolicy.penaltyPercentage;
                        appointment.cancellationPenalty = penaltyPercentage;
                    }
                }
                if (!doctor) {
                    throw new Error('Doctor not found');
                }
                appointment.status = 'cancelled';
                appointment.cancellationReason = reason;
                yield appointment.save();
                // Cancel Google Calendar event if exists
                if (appointment.googleEventId && appointment.googleCalendarId) {
                    try {
                        if (doctor === null || doctor === void 0 ? void 0 : doctor.googleRefreshToken) {
                            yield googleCalendar_service_1.GoogleCalendarService.deleteEvent(doctor.googleRefreshToken, appointment.googleCalendarId, appointment.googleEventId, doctor.id);
                        }
                    }
                    catch (error) {
                        console.error('Failed to delete Google Calendar event:', error);
                    }
                }
                // Notify patient via WhatsApp
                const patient = yield models_1.Patient.findOne({ id: appointment.patientId });
                if ((_a = patient === null || patient === void 0 ? void 0 : patient.communicationPreferences) === null || _a === void 0 ? void 0 : _a.whatsappEnabled) {
                    try {
                        yield whatsapp_service_1.WhatsAppService.sendTextMessage(patient.phone, `Tu cita del ${appointment.dateTime.toLocaleDateString('es-CL')} a las ${appointment.dateTime.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} ha sido cancelada.\nMotivo: ${reason}`, doctor.id);
                    }
                    catch (error) {
                        console.error('Failed to send cancellation notification:', error);
                    }
                }
                // Log the event
                yield models_1.EventLog.create({
                    id: (0, uuid_1.v4)(),
                    level: 'warning',
                    category: 'appointment',
                    action: 'appointment_cancelled',
                    userId: doctorId,
                    userType: 'doctor',
                    resourceId: appointmentId,
                    resourceType: 'appointment',
                    details: { reason, penalty: appointment.cancellationPenalty }
                });
                return yield this.getAppointmentWithDetails(appointmentId);
            }
            catch (error) {
                throw new Error(`Failed to cancel appointment: ${error}`);
            }
        });
    }
    /**
     * Check availability for a time slot
     */
    static checkAvailability(doctorId, dateTime, duration) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('🔍 [AVAILABILITY] Checking availability for:', {
                    doctorId,
                    dateTime: dateTime.toISOString(),
                    duration
                });
                // 1. Check working hours first
                const isWithinWorkingHours = yield this.checkWorkingHours(doctorId, dateTime, duration);
                if (!isWithinWorkingHours) {
                    console.log('❌ [AVAILABILITY] Outside working hours');
                    return false;
                }
                // 2. Check database for overlapping appointments
                const isDatabaseAvailable = yield this.checkDatabaseAvailability(doctorId, dateTime, duration);
                if (!isDatabaseAvailable) {
                    console.log('❌ [AVAILABILITY] Database conflict found');
                    return false;
                }
                // 3. Check Google Calendar for conflicts (if connected)
                const isGoogleCalendarAvailable = yield this.checkGoogleCalendarAvailability(doctorId, dateTime, duration);
                if (!isGoogleCalendarAvailable) {
                    console.log('❌ [AVAILABILITY] Google Calendar conflict found');
                    return false;
                }
                console.log('✅ [AVAILABILITY] Time slot is available');
                return true;
            }
            catch (error) {
                console.error('❌ [AVAILABILITY] Error checking availability:', error);
                throw new Error(`Failed to check availability: ${error}`);
            }
        });
    }
    /**
     * Check if the appointment time is within working hours
     */
    static checkWorkingHours(doctorId, dateTime, duration) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const doctor = yield models_1.Doctor.findOne({ id: doctorId, isActive: true });
                if (!doctor) {
                    throw new Error('Doctor not found');
                }
                // Get day of week (0 = Sunday, 1 = Monday, etc.)
                // IMPORTANT: dateTime is in UTC, but working hours are in doctor's local timezone
                // We need to convert UTC to doctor's timezone to get the correct day
                const doctorTimezone = doctor.timezone || 'America/Santiago';
                const localDateTime = timezone_service_1.TimezoneService.convertToUserTimezone(dateTime, doctorTimezone);
                const dayOfWeek = localDateTime.getDay();
                const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const dayName = dayNames[dayOfWeek];
                const workingHours = (_b = (_a = doctor.practiceSettings) === null || _a === void 0 ? void 0 : _a.workingHours) === null || _b === void 0 ? void 0 : _b[dayName];
                if (!(workingHours === null || workingHours === void 0 ? void 0 : workingHours.available)) {
                    console.log(`❌ [WORKING HOURS] ${dayName} is not a working day`);
                    return false;
                }
                // Parse working hours
                const [startHour, startMinute] = workingHours.start.split(':').map(Number);
                const [endHour, endMinute] = workingHours.end.split(':').map(Number);
                // Create working hours in doctor's local timezone
                const workStart = new Date(localDateTime);
                workStart.setHours(startHour, startMinute, 0, 0);
                const workEnd = new Date(localDateTime);
                workEnd.setHours(endHour, endMinute, 0, 0);
                // Check if appointment fits within working hours (using local time)
                const appointmentEnd = new Date(localDateTime.getTime() + duration * 60000);
                // Check if appointment fits within working hours
                const isWithinHours = localDateTime >= workStart && appointmentEnd <= workEnd;
                console.log(`🔍 [WORKING HOURS] ${dayName}: ${workStart.toTimeString()} - ${workEnd.toTimeString()}`);
                console.log(`🔍 [WORKING HOURS] Appointment (local): ${localDateTime.toTimeString()} - ${appointmentEnd.toTimeString()}`);
                console.log(`🔍 [WORKING HOURS] Appointment (UTC): ${dateTime.toTimeString()}`);
                console.log(`🔍 [WORKING HOURS] Doctor timezone: ${doctorTimezone}`);
                console.log(`🔍 [WORKING HOURS] Within hours: ${isWithinHours}`);
                return isWithinHours;
            }
            catch (error) {
                console.error('❌ [WORKING HOURS] Error checking working hours:', error);
                return false;
            }
        });
    }
    /**
     * Check database availability for overlapping appointments
     */
    static checkDatabaseAvailability(doctorId, dateTime, duration) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const endTime = new Date(dateTime.getTime() + duration * 60000);
                // Check for overlapping appointments in database
                const overlappingAppointment = yield models_1.Appointment.findOne({
                    doctorId,
                    status: { $in: ['scheduled', 'confirmed'] },
                    $or: [
                        {
                            dateTime: { $lt: endTime },
                            $expr: {
                                $gte: [
                                    { $add: ['$dateTime', { $multiply: ['$duration', 60000] }] },
                                    dateTime
                                ]
                            }
                        }
                    ]
                });
                const isAvailable = !overlappingAppointment;
                console.log(`🔍 [DATABASE] Database availability: ${isAvailable}`);
                return isAvailable;
            }
            catch (error) {
                console.error('❌ [DATABASE] Error checking database availability:', error);
                return false;
            }
        });
    }
    /**
     * Check Google Calendar availability for conflicts
     */
    static checkGoogleCalendarAvailability(doctorId, dateTime, duration) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const doctor = yield models_1.Doctor.findOne({ id: doctorId, isActive: true });
                if (!((_b = (_a = doctor === null || doctor === void 0 ? void 0 : doctor.calendar) === null || _a === void 0 ? void 0 : _a.oauth) === null || _b === void 0 ? void 0 : _b.refreshToken) || !((_d = (_c = doctor === null || doctor === void 0 ? void 0 : doctor.calendar) === null || _c === void 0 ? void 0 : _c.oauth) === null || _d === void 0 ? void 0 : _d.calendarId)) {
                    console.log('🔍 [GOOGLE CALENDAR] Doctor not connected to Google Calendar, skipping check');
                    return true; // If not connected, assume available
                }
                const endTime = new Date(dateTime.getTime() + duration * 60000);
                console.log(`🔍 [GOOGLE CALENDAR] Checking availability in UTC:`, {
                    startTime: dateTime.toISOString(),
                    endTime: endTime.toISOString(),
                    doctorTimezone: doctor.timezone || 'America/Santiago'
                });
                // Use Google Calendar API to check for conflicts
                const isAvailable = yield googleCalendar_service_1.GoogleCalendarService.checkAvailability(doctor.calendar.oauth.refreshToken, doctor.calendar.oauth.calendarId, dateTime.toISOString(), endTime.toISOString(), doctorId);
                console.log(`🔍 [GOOGLE CALENDAR] Google Calendar availability: ${isAvailable}`);
                return isAvailable;
            }
            catch (error) {
                console.error('❌ [GOOGLE CALENDAR] Error checking Google Calendar availability:', error);
                // If Google Calendar check fails, assume available to not block appointment creation
                return true;
            }
        });
    }
    /**
     * Get available time slots for a date
     */
    static getAvailableSlots(doctorId_1, date_1) {
        return __awaiter(this, arguments, void 0, function* (doctorId, date, duration = 60) {
            try {
                const doctor = yield models_1.Doctor.findOne({ id: doctorId, isActive: true });
                if (!doctor) {
                    throw new Error('Doctor not found');
                }
                const startOfDay = new Date(date);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(date);
                endOfDay.setHours(23, 59, 59, 999);
                // Get working hours for the day
                // IMPORTANT: date is in UTC, but working hours are in doctor's local timezone
                const doctorTimezone = doctor.timezone || 'America/Santiago';
                const localDate = timezone_service_1.TimezoneService.convertToUserTimezone(date, doctorTimezone);
                const dayOfWeek = localDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                const workingHours = doctor.practiceSettings.workingHours[dayOfWeek];
                if (!(workingHours === null || workingHours === void 0 ? void 0 : workingHours.available)) {
                    return [];
                }
                // Parse working hours
                const [startHour, startMinute] = workingHours.start.split(':').map(Number);
                const [endHour, endMinute] = workingHours.end.split(':').map(Number);
                // Create working hours in doctor's local timezone, then convert to UTC for comparison
                const localWorkStart = new Date(localDate);
                localWorkStart.setHours(startHour, startMinute, 0, 0);
                const localWorkEnd = new Date(localDate);
                localWorkEnd.setHours(endHour, endMinute, 0, 0);
                // Convert local working hours to UTC for database queries
                const workStart = timezone_service_1.TimezoneService.convertToUTC(localWorkStart, doctorTimezone);
                const workEnd = timezone_service_1.TimezoneService.convertToUTC(localWorkEnd, doctorTimezone);
                // Get existing appointments for the day
                const existingAppointments = yield models_1.Appointment.find({
                    doctorId,
                    dateTime: { $gte: startOfDay, $lte: endOfDay },
                    status: { $in: ['scheduled', 'confirmed'] }
                }).sort({ dateTime: 1 });
                // Generate available slots
                const slots = [];
                let currentTime = new Date(workStart);
                while (currentTime < workEnd) {
                    const slotEnd = new Date(currentTime.getTime() + duration * 60000);
                    if (slotEnd <= workEnd) {
                        // Check if this slot conflicts with existing appointments
                        const isAvailable = !existingAppointments.some(appointment => {
                            const appointmentEnd = new Date(appointment.dateTime.getTime() + appointment.duration * 60000);
                            return ((currentTime < appointmentEnd && slotEnd > appointment.dateTime));
                        });
                        slots.push({
                            start: new Date(currentTime),
                            end: slotEnd,
                            available: isAvailable
                        });
                    }
                    currentTime = new Date(currentTime.getTime() + 30 * 60000); // 30-minute intervals
                }
                return slots;
            }
            catch (error) {
                throw new Error(`Failed to get available slots: ${error}`);
            }
        });
    }
    /**
     * Get doctor availability for a date range
     */
    static getDoctorAvailability(doctorId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const doctor = yield models_1.Doctor.findOne({ id: doctorId, isActive: true });
                if (!doctor) {
                    throw new Error('Doctor not found');
                }
                const slots = [];
                const currentDate = new Date(startDate);
                while (currentDate <= endDate) {
                    const dayOfWeek = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
                    const workingHours = doctor.practiceSettings.workingHours[dayOfWeek];
                    if (workingHours === null || workingHours === void 0 ? void 0 : workingHours.available) {
                        const daySlots = yield this.getAvailableSlots(doctorId, currentDate, doctor.practiceSettings.appointmentDuration);
                        slots.push(...daySlots);
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                }
                return slots;
            }
            catch (error) {
                throw new Error(`Failed to get doctor availability: ${error}`);
            }
        });
    }
    /**
     * Complete appointment
     */
    static completeAppointment(appointmentId, doctorId, consultationDetails) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const appointment = yield models_1.Appointment.findOne({ id: appointmentId, doctorId });
                if (!appointment) {
                    throw new Error('Appointment not found');
                }
                if (appointment.status !== 'confirmed') {
                    throw new Error('Appointment must be confirmed to complete');
                }
                appointment.status = 'completed';
                appointment.consultationDetails = Object.assign({ type: appointment.type, duration: appointment.duration, price: 0 }, consultationDetails);
                yield appointment.save();
                // Log the event
                yield models_1.EventLog.create({
                    id: (0, uuid_1.v4)(),
                    level: 'info',
                    category: 'appointment',
                    action: 'appointment_completed',
                    userId: doctorId,
                    userType: 'doctor',
                    details: { diagnosis: consultationDetails.diagnosis }
                });
                return yield this.getAppointmentWithDetails(appointmentId);
            }
            catch (error) {
                throw new Error(`Failed to complete appointment: ${error}`);
            }
        });
    }
}
exports.AppointmentService = AppointmentService;
