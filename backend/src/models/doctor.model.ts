import mongoose, { Document, Schema } from 'mongoose';

// Sub-schemas for nested objects
const PracticeSettingsSchema = new Schema({
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

const BillingPreferencesSchema = new Schema({
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
const GoogleCalendarOAuthSchema = new Schema({
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
const CalendarSchema = new Schema({
  oauth: { type: GoogleCalendarOAuthSchema, default: () => ({}) },
  lastSync: { type: Date, required: false },
  nextSync: { type: Date, required: false }
});

export interface IDoctor extends Document {
  id: string;
  name: string;
  email: string;
  password: string;
  specialization: string;
  licenseNumber: string;
  phone: string;
  address?: string;
  timezone: string; // Zona horaria del doctor (default: America/Santiago)
  googleCalendarId?: string;
  googleRefreshToken?: string;
  practiceSettings: {
    appointmentDuration: number;
    maxAppointmentsPerDay: number;
    workingHours: {
      [key: string]: { start: string; end: string; available: boolean };
    };
    consultationTypes: Array<{
      type: 'presential' | 'remote' | 'home';
      price: number;
      duration: number;
    }>;
    cancellationPolicy: {
      hoursNotice: number;
      penaltyPercentage: number;
    };
  };
  billingPreferences: {
    billingCycle: 'daily' | 'weekly' | 'monthly';
    automaticReminders: boolean;
    reminder24hBefore: boolean;
    reminder2hBefore: boolean;
    reminderAfterAppointment: boolean;
    paymentMethods: string[];
    defaultCurrency: string;
    taxPercentage: number;
  };
  calendar?: {
    oauth?: {
      accessToken?: string;
      refreshToken?: string;
      expiryDate?: Date;
      scope?: string;
      tokenType?: string;
      calendarId?: string;
      calendarName?: string;
      lastSync?: Date;
      nextSync?: Date;
      isActive?: boolean;
    };
    lastSync?: Date;
    nextSync?: Date;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const doctorSchema = new Schema<IDoctor>({
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
doctorSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create only necessary indexes (avoiding duplicates with unique: true fields)
doctorSchema.index({ phone: 1 });
doctorSchema.index({ isActive: 1 });

export const Doctor = mongoose.model<IDoctor>('Doctor', doctorSchema);

export default Doctor;
