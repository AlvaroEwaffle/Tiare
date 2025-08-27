import mongoose, { Document, Schema } from 'mongoose';

// Sub-schemas for nested objects
const ConsultationDetailsSchema = new Schema({
  type: { type: String, enum: ['presential', 'remote', 'home'], required: true },
  duration: { type: Number, required: true }, // minutes
  price: { type: Number, required: true },
  notes: { type: String },
  diagnosis: { type: String },
  prescription: { type: String },
  nextAppointment: { type: Date }
});

const ReminderSchema = new Schema({
  type: { type: String, enum: ['24h_before', '2h_before', 'payment_reminder', 'follow_up'], required: true },
  sent: { type: Boolean, default: false },
  sentAt: { type: Date },
  method: { type: String, enum: ['whatsapp', 'email', 'sms'], required: true }
});

export interface IAppointment extends Document {
  id: string;
  doctorId: string;
  patientId: string;
  dateTime: Date;
  duration: number; // minutes
  type: 'presential' | 'remote' | 'home';
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  title?: string; // Event title/name
  consultationDetails?: {
    type: 'presential' | 'remote' | 'home';
    duration: number;
    price: number;
    notes?: string;
    diagnosis?: string;
    prescription?: string;
    nextAppointment?: Date;
  };
  googleEventId?: string;
  googleCalendarId?: string;
  reminders: Array<{
    type: '24h_before' | '2h_before' | 'payment_reminder' | 'follow_up';
    sent: boolean;
    sentAt?: Date;
    method: 'whatsapp' | 'email' | 'sms';
  }>;
  cancellationReason?: string;
  cancellationPenalty?: number;
  createdAt: Date;
  updatedAt: Date;
}

const appointmentSchema = new Schema<IAppointment>({
  id: { type: String, required: true, unique: true },
  doctorId: { type: String, required: true },
  patientId: { type: String, required: true },
  dateTime: { type: Date, required: true },
  duration: { type: Number, required: true },
  type: { type: String, enum: ['presential', 'remote', 'home'], required: true },
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
appointmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create indexes for faster queries
appointmentSchema.index({ doctorId: 1, dateTime: 1 });
appointmentSchema.index({ patientId: 1, dateTime: 1 });
appointmentSchema.index({ status: 1, dateTime: 1 });
appointmentSchema.index({ googleEventId: 1 });

export const Appointment = mongoose.model<IAppointment>('Appointment', appointmentSchema);
