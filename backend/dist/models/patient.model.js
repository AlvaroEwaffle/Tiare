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
exports.Patient = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Sub-schemas for nested objects
const MedicalNoteSchema = new mongoose_1.Schema({
    date: { type: Date, required: true },
    note: { type: String, required: true },
    type: { type: String, enum: ['consultation', 'observation', 'prescription', 'test_result'], required: true },
    doctorId: { type: String, required: true }
});
const CommunicationPreferencesSchema = new mongoose_1.Schema({
    preferredLanguage: { type: String, default: 'es' },
    whatsappEnabled: { type: Boolean, default: true },
    emailEnabled: { type: Boolean, default: false },
    smsEnabled: { type: Boolean, default: false },
    reminderPreferences: {
        appointment24h: { type: Boolean, default: true },
        appointment2h: { type: Boolean, default: true },
        paymentReminders: { type: Boolean, default: true },
        followUpReminders: { type: Boolean, default: true }
    }
});
const EmergencyContactSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    relationship: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String }
});
const patientSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true },
    doctorId: { type: String, required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    timezone: { type: String, enum: ['America/Santiago', 'America/New_York', 'America/Los_Angeles', 'Europe/Madrid', 'Europe/London', 'UTC'] },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
    address: { type: String },
    emergencyContact: { type: EmergencyContactSchema },
    medicalHistory: [{ type: MedicalNoteSchema }],
    communicationPreferences: { type: CommunicationPreferencesSchema, default: () => ({}) },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
// Update the updatedAt field before saving
patientSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});
// Create index for faster queries
patientSchema.index({ doctorId: 1, phone: 1 });
patientSchema.index({ doctorId: 1, email: 1 });
exports.Patient = mongoose_1.default.model('Patient', patientSchema);
