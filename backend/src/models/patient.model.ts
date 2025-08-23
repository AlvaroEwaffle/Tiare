import mongoose, { Document, Schema } from 'mongoose';

// Sub-schemas for nested objects
const MedicalNoteSchema = new Schema({
  date: { type: Date, required: true },
  note: { type: String, required: true },
  type: { type: String, enum: ['consultation', 'observation', 'prescription', 'test_result'], required: true },
  doctorId: { type: String, required: true }
});

const CommunicationPreferencesSchema = new Schema({
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

const EmergencyContactSchema = new Schema({
  name: { type: String, required: true },
  relationship: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String }
});

export interface IPatient extends Document {
  id: string;
  doctorId: string;
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  address?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  medicalHistory: Array<{
    date: Date;
    note: string;
    type: 'consultation' | 'observation' | 'prescription' | 'test_result';
    doctorId: string;
  }>;
  communicationPreferences: {
    preferredLanguage: string;
    whatsappEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
    reminderPreferences: {
      appointment24h: boolean;
      appointment2h: boolean;
      paymentReminders: boolean;
      followUpReminders: boolean;
    };
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const patientSchema = new Schema<IPatient>({
  id: { type: String, required: true, unique: true },
  doctorId: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
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
patientSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create index for faster queries
patientSchema.index({ doctorId: 1, phone: 1 });
patientSchema.index({ doctorId: 1, email: 1 });

export const Patient = mongoose.model<IPatient>('Patient', patientSchema);
