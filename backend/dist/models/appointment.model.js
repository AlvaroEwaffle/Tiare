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
exports.Appointment = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Sub-schemas for nested objects
const ConsultationDetailsSchema = new mongoose_1.Schema({
    type: { type: String, enum: ['presential', 'remote', 'home'], required: true },
    duration: { type: Number, required: true }, // minutes
    price: { type: Number, required: true },
    notes: { type: String },
    diagnosis: { type: String },
    prescription: { type: String },
    nextAppointment: { type: Date }
});
const ReminderSchema = new mongoose_1.Schema({
    type: { type: String, enum: ['24h_before', '2h_before', 'payment_reminder', 'follow_up'], required: true },
    sent: { type: Boolean, default: false },
    sentAt: { type: Date },
    method: { type: String, enum: ['whatsapp', 'email', 'sms'], required: true }
});
const appointmentSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true },
    doctorId: { type: String, required: true },
    patientId: { type: String, required: true },
    dateTime: { type: Date, required: true, comment: 'ALWAYS stored in UTC' }, // ALWAYS stored in UTC
    duration: { type: Number, required: true },
    type: { type: String, enum: ['presential', 'remote', 'home'], required: true },
    timezone: { type: String, enum: ['America/Santiago', 'America/New_York', 'America/Los_Angeles', 'Europe/Madrid', 'Europe/London', 'UTC'] },
    status: {
        type: String,
        enum: ['scheduled', 'confirmed', 'cancelled', 'completed', 'no_show'],
        default: 'scheduled'
    },
    title: { type: String }, // Event title/name
    consultationDetails: { type: ConsultationDetailsSchema },
    googleEventId: { type: String },
    googleCalendarId: { type: String },
    reminders: [{ type: ReminderSchema }],
    cancellationReason: { type: String },
    cancellationPenalty: { type: Number },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
// Update the updatedAt field before saving
appointmentSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});
// Create indexes for faster queries
appointmentSchema.index({ doctorId: 1, dateTime: 1 });
appointmentSchema.index({ patientId: 1, dateTime: 1 });
appointmentSchema.index({ status: 1, dateTime: 1 });
appointmentSchema.index({ googleEventId: 1 });
exports.Appointment = mongoose_1.default.model('Appointment', appointmentSchema);
