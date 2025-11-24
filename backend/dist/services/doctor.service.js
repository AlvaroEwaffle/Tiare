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
exports.DoctorService = void 0;
const uuid_1 = require("uuid");
const models_1 = require("../models");
const auth_service_1 = require("./auth.service");
const googleCalendar_service_1 = require("./googleCalendar.service");
class DoctorService {
    /**
     * Create a new doctor
     */
    static createDoctor(doctorData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Check if doctor already exists
                const existingDoctor = yield models_1.Doctor.findOne({
                    $or: [{ email: doctorData.email }, { licenseNumber: doctorData.licenseNumber }]
                });
                if (existingDoctor) {
                    throw new Error('Doctor with this email or license number already exists');
                }
                // Create doctor with authentication
                const { doctor, tokens } = yield auth_service_1.AuthService.registerDoctor(doctorData);
                // Log the event
                yield models_1.EventLog.create({
                    id: (0, uuid_1.v4)(),
                    level: 'info',
                    category: 'doctor',
                    action: 'doctor_created',
                    userId: doctor.id,
                    userType: 'doctor',
                    resourceId: doctor.id,
                    resourceType: 'doctor',
                    details: { email: doctor.email, specialization: doctor.specialization }
                });
                return { doctor, tokens };
            }
            catch (error) {
                throw new Error(`Failed to create doctor: ${error}`);
            }
        });
    }
    /**
     * Get doctor by ID
     */
    static getDoctorById(doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const doctor = yield models_1.Doctor.findOne({ id: doctorId, isActive: true });
                if (!doctor)
                    return null;
                return {
                    id: doctor.id,
                    name: doctor.name,
                    email: doctor.email,
                    specialization: doctor.specialization,
                    licenseNumber: doctor.licenseNumber,
                    phone: doctor.phone,
                    address: doctor.address,
                    practiceSettings: doctor.practiceSettings,
                    billingPreferences: doctor.billingPreferences,
                    isActive: doctor.isActive,
                    createdAt: doctor.createdAt,
                    updatedAt: doctor.updatedAt
                };
            }
            catch (error) {
                throw new Error(`Failed to get doctor: ${error}`);
            }
        });
    }
    /**
     * Get doctor by email
     */
    static getDoctorByEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const doctor = yield models_1.Doctor.findOne({ email, isActive: true });
                if (!doctor)
                    return null;
                return {
                    id: doctor.id,
                    name: doctor.name,
                    email: doctor.email,
                    specialization: doctor.specialization,
                    licenseNumber: doctor.licenseNumber,
                    phone: doctor.phone,
                    address: doctor.address,
                    practiceSettings: doctor.practiceSettings,
                    billingPreferences: doctor.billingPreferences,
                    isActive: doctor.isActive,
                    createdAt: doctor.createdAt,
                    updatedAt: doctor.updatedAt
                };
            }
            catch (error) {
                throw new Error(`Failed to get doctor by email: ${error}`);
            }
        });
    }
    /**
     * Update doctor profile
     */
    static updateDoctor(doctorId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const doctor = yield models_1.Doctor.findOne({ id: doctorId, isActive: true });
                if (!doctor) {
                    throw new Error('Doctor not found');
                }
                // Update fields
                if (updateData.name)
                    doctor.name = updateData.name;
                if (updateData.specialization)
                    doctor.specialization = updateData.specialization;
                if (updateData.phone)
                    doctor.phone = updateData.phone;
                if (updateData.address !== undefined)
                    doctor.address = updateData.address;
                // Update practice settings
                if (updateData.practiceSettings) {
                    if (updateData.practiceSettings.appointmentDuration !== undefined) {
                        doctor.practiceSettings.appointmentDuration = updateData.practiceSettings.appointmentDuration;
                    }
                    if (updateData.practiceSettings.maxAppointmentsPerDay !== undefined) {
                        doctor.practiceSettings.maxAppointmentsPerDay = updateData.practiceSettings.maxAppointmentsPerDay;
                    }
                    if (updateData.practiceSettings.workingHours) {
                        doctor.practiceSettings.workingHours = Object.assign(Object.assign({}, doctor.practiceSettings.workingHours), updateData.practiceSettings.workingHours);
                    }
                    if (updateData.practiceSettings.consultationTypes) {
                        doctor.practiceSettings.consultationTypes = updateData.practiceSettings.consultationTypes;
                    }
                    if (updateData.practiceSettings.cancellationPolicy) {
                        doctor.practiceSettings.cancellationPolicy = Object.assign(Object.assign({}, doctor.practiceSettings.cancellationPolicy), updateData.practiceSettings.cancellationPolicy);
                    }
                }
                // Update billing preferences
                if (updateData.billingPreferences) {
                    Object.assign(doctor.billingPreferences, updateData.billingPreferences);
                }
                yield doctor.save();
                // Log the event
                yield models_1.EventLog.create({
                    id: (0, uuid_1.v4)(),
                    level: 'info',
                    category: 'doctor',
                    action: 'doctor_updated',
                    userId: doctorId,
                    userType: 'doctor',
                    resourceId: doctorId,
                    resourceType: 'doctor',
                    details: { updatedFields: Object.keys(updateData) }
                });
                return {
                    id: doctor.id,
                    name: doctor.name,
                    email: doctor.email,
                    specialization: doctor.specialization,
                    licenseNumber: doctor.licenseNumber,
                    phone: doctor.phone,
                    address: doctor.address,
                    practiceSettings: doctor.practiceSettings,
                    billingPreferences: doctor.billingPreferences,
                    isActive: doctor.isActive,
                    createdAt: doctor.createdAt,
                    updatedAt: doctor.updatedAt
                };
            }
            catch (error) {
                throw new Error(`Failed to update doctor: ${error}`);
            }
        });
    }
    /**
     * Connect Google Calendar
     */
    static connectGoogleCalendar(doctorId, authCode) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const doctor = yield models_1.Doctor.findOne({ id: doctorId, isActive: true });
                if (!doctor) {
                    throw new Error('Doctor not found');
                }
                // Exchange auth code for tokens
                const tokens = yield googleCalendar_service_1.GoogleCalendarService.exchangeCodeForTokens(authCode);
                // Update doctor with Google Calendar info
                doctor.googleCalendarId = doctor.email; // Use email as default calendar ID
                doctor.googleRefreshToken = tokens.refreshToken;
                yield doctor.save();
                // Log the event
                yield models_1.EventLog.create({
                    id: (0, uuid_1.v4)(),
                    level: 'info',
                    category: 'calendar',
                    action: 'google_calendar_connected',
                    userId: doctorId,
                    userType: 'doctor',
                    resourceId: doctorId,
                    resourceType: 'doctor',
                    details: { calendarId: doctor.googleCalendarId }
                });
                return { success: true, message: 'Google Calendar connected successfully' };
            }
            catch (error) {
                throw new Error(`Failed to connect Google Calendar: ${error}`);
            }
        });
    }
    /**
     * Disconnect Google Calendar
     */
    static disconnectGoogleCalendar(doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const doctor = yield models_1.Doctor.findOne({ id: doctorId, isActive: true });
                if (!doctor) {
                    throw new Error('Doctor not found');
                }
                // Clear Google Calendar info
                doctor.googleCalendarId = undefined;
                doctor.googleRefreshToken = undefined;
                yield doctor.save();
                // Log the event
                yield models_1.EventLog.create({
                    id: (0, uuid_1.v4)(),
                    level: 'info',
                    category: 'calendar',
                    action: 'google_calendar_disconnected',
                    userId: doctorId,
                    userType: 'doctor',
                    resourceId: doctorId,
                    resourceType: 'doctor',
                    details: {}
                });
                return { success: true, message: 'Google Calendar disconnected successfully' };
            }
            catch (error) {
                throw new Error(`Failed to disconnect Google Calendar: ${error}`);
            }
        });
    }
    /**
     * Get doctor's working hours
     */
    static getWorkingHours(doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const doctor = yield models_1.Doctor.findOne({ id: doctorId, isActive: true });
                if (!doctor) {
                    throw new Error('Doctor not found');
                }
                return doctor.practiceSettings.workingHours;
            }
            catch (error) {
                throw new Error(`Failed to get working hours: ${error}`);
            }
        });
    }
    /**
     * Update working hours
     */
    static updateWorkingHours(doctorId, workingHours) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const doctor = yield models_1.Doctor.findOne({ id: doctorId, isActive: true });
                if (!doctor) {
                    throw new Error('Doctor not found');
                }
                doctor.practiceSettings.workingHours = workingHours;
                yield doctor.save();
                // Log the event
                yield models_1.EventLog.create({
                    id: (0, uuid_1.v4)(),
                    level: 'info',
                    category: 'doctor',
                    action: 'working_hours_updated',
                    userId: doctorId,
                    userType: 'doctor',
                    resourceId: doctorId,
                    resourceType: 'doctor',
                    details: { workingHours }
                });
                return workingHours;
            }
            catch (error) {
                throw new Error(`Failed to update working hours: ${error}`);
            }
        });
    }
    /**
     * Get consultation types and prices
     */
    static getConsultationTypes(doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const doctor = yield models_1.Doctor.findOne({ id: doctorId, isActive: true });
                if (!doctor) {
                    throw new Error('Doctor not found');
                }
                return doctor.practiceSettings.consultationTypes || [];
            }
            catch (error) {
                throw new Error(`Failed to get consultation types: ${error}`);
            }
        });
    }
    /**
     * Update consultation types
     */
    static updateConsultationTypes(doctorId, consultationTypes) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const doctor = yield models_1.Doctor.findOne({ id: doctorId, isActive: true });
                if (!doctor) {
                    throw new Error('Doctor not found');
                }
                doctor.practiceSettings.consultationTypes = consultationTypes;
                yield doctor.save();
                // Log the event
                yield models_1.EventLog.create({
                    id: (0, uuid_1.v4)(),
                    level: 'info',
                    category: 'doctor',
                    action: 'consultation_types_updated',
                    userId: doctorId,
                    userType: 'doctor',
                    resourceId: doctorId,
                    resourceType: 'doctor',
                    details: { consultationTypes }
                });
                return consultationTypes;
            }
            catch (error) {
                throw new Error(`Failed to update consultation types: ${error}`);
            }
        });
    }
    /**
     * Deactivate doctor account
     */
    static deactivateDoctor(doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const doctor = yield models_1.Doctor.findOne({ id: doctorId, isActive: true });
                if (!doctor) {
                    throw new Error('Doctor not found');
                }
                doctor.isActive = false;
                yield doctor.save();
                // Log the event
                yield models_1.EventLog.create({
                    id: (0, uuid_1.v4)(),
                    level: 'warning',
                    category: 'doctor',
                    action: 'doctor_deactivated',
                    userId: doctorId,
                    userType: 'doctor',
                    resourceId: doctorId,
                    resourceType: 'doctor',
                    details: {}
                });
                return { success: true, message: 'Doctor account deactivated successfully' };
            }
            catch (error) {
                throw new Error(`Failed to deactivate doctor: ${error}`);
            }
        });
    }
    /**
     * Reactivate doctor account
     */
    static reactivateDoctor(doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const doctor = yield models_1.Doctor.findOne({ id: doctorId, isActive: false });
                if (!doctor) {
                    throw new Error('Doctor not found or already active');
                }
                doctor.isActive = true;
                yield doctor.save();
                // Log the event
                yield models_1.EventLog.create({
                    id: (0, uuid_1.v4)(),
                    level: 'info',
                    category: 'doctor',
                    action: 'doctor_reactivated',
                    userId: doctorId,
                    userType: 'doctor',
                    resourceId: doctorId,
                    resourceType: 'doctor',
                    details: {}
                });
                return { success: true, message: 'Doctor account reactivated successfully' };
            }
            catch (error) {
                throw new Error(`Failed to reactivate doctor: ${error}`);
            }
        });
    }
}
exports.DoctorService = DoctorService;
