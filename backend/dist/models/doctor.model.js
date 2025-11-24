"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Doctor = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Sub-schemas for nested objects
const PracticeSettingsSchema = new mongoose_1.Schema({
    appointmentDuration: { type: Number, default: 60 }, // minutes
    maxAppointmentsPerDay: { type: Number, default: 8 },
    workingHours: {
        monday: { start: String, end: String, available: { type: Boolean, default: true } },
        tuesday: { start: String, end: String, available: { type: Boolean, default: true } },
        wednesday: { start: String, end: String, available: { type: Boolean, default: true } },
        thursday: { start: String, end: String, available: { type: Boolean, default: true } },
        friday: { start: String, end: String, available: { type: Boolean, default: true } },
        saturday: { start: String, end: String, available: { type: Boolean, default: false } },
        sunday: { start: String, end: String, available: { type: Boolean, default: false } }
    },
    consultationTypes: [{
            type: { type: String, enum: ['presential', 'remote', 'home'], required: true },
            price: { type: Number, required: true },
            duration: { type: Number, required: true }
        }],
    cancellationPolicy: {
        hoursNotice: { type: Number, default: 24 },
        penaltyPercentage: { type: Number, default: 0 }
    }
});
const BillingPreferencesSchema = new mongoose_1.Schema({
    billingCycle: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
    automaticReminders: { type: Boolean, default: true },
    reminder24hBefore: { type: Boolean, default: true },
    reminder2hBefore: { type: Boolean, default: true },
    reminderAfterAppointment: { type: Boolean, default: true },
    paymentMethods: [String], // ['transfer', 'cash', 'card']
    defaultCurrency: { type: String, default: 'CLP' },
    taxPercentage: { type: Number, default: 0 }
});
// Google Calendar OAuth sub-schema
const GoogleCalendarOAuthSchema = new mongoose_1.Schema({
    accessToken: { type: String, required: false },
    refreshToken: { type: String, required: false },
    expiryDate: { type: Date, required: false },
    scope: {
        type: String,
        default: 'https://www.googleapis.com/auth/calendar'
    },
    tokenType: {
        type: String,
        default: 'Bearer'
    },
    calendarId: { type: String, required: false },
    calendarName: { type: String, required: false },
    lastSync: { type: Date, required: false },
    nextSync: { type: Date, required: false },
    isActive: { type: Boolean, default: false }
});
// Calendar schema that contains oauth as a sub-object
const CalendarSchema = new mongoose_1.Schema({
    oauth: { type: GoogleCalendarOAuthSchema, default: () => ({}) },
    lastSync: { type: Date, required: false },
    nextSync: { type: Date, required: false }
});
const doctorSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    specialization: { type: String, required: true },
    licenseNumber: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    address: { type: String },
    timezone: { type: String, default: 'America/Santiago', enum: ['America/Santiago', 'America/New_York', 'America/Los_Angeles', 'Europe/Madrid', 'Europe/London', 'UTC'] },
    googleCalendarId: { type: String },
    googleRefreshToken: { type: String },
    practiceSettings: { type: PracticeSettingsSchema, default: () => ({}) },
    billingPreferences: { type: BillingPreferencesSchema, default: () => ({}) },
    calendar: { type: CalendarSchema, default: () => ({}) },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
// Update the updatedAt field before saving
doctorSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});
// Create only necessary indexes (avoiding duplicates with unique: true fields)
doctorSchema.index({ phone: 1 });
doctorSchema.index({ isActive: 1 });
exports.Doctor = mongoose_1.default.model('Doctor', doctorSchema);
exports.default = exports.Doctor;
