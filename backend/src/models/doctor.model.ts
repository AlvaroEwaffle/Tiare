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

export interface IDoctor extends Document {
  id: string;
  name: string;
  email: string;
  password: string;
  specialization: string;
  licenseNumber: string;
  phone: string;
  address?: string;
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
  googleCalendarId: { type: String },
  googleRefreshToken: { type: String },
  practiceSettings: { type: PracticeSettingsSchema, default: () => ({}) },
  billingPreferences: { type: BillingPreferencesSchema, default: () => ({}) },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
doctorSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Doctor = mongoose.model<IDoctor>('Doctor', doctorSchema);
