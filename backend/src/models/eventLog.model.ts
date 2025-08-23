import mongoose, { Document, Schema } from 'mongoose';

export interface IEventLog extends Document {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'critical';
  category: 'authentication' | 'appointment' | 'billing' | 'patient' | 'doctor' | 'system' | 'whatsapp' | 'calendar';
  action: string;
  userId?: string;
  userType?: 'doctor' | 'patient' | 'system';
  resourceId?: string;
  resourceType?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

const eventLogSchema = new Schema<IEventLog>({
  id: { type: String, required: true, unique: true },
  timestamp: { type: Date, default: Date.now },
  level: { 
    type: String, 
    enum: ['info', 'warning', 'error', 'critical'], 
    default: 'info' 
  },
  category: { 
    type: String, 
    enum: ['authentication', 'appointment', 'billing', 'patient', 'doctor', 'system', 'whatsapp', 'calendar'], 
    required: true 
  },
  action: { type: String, required: true },
  userId: { type: String },
  userType: { type: String, enum: ['doctor', 'patient', 'system'] },
  resourceId: { type: String },
  resourceType: { type: String },
  details: { type: Schema.Types.Mixed, default: {} },
  ipAddress: { type: String },
  userAgent: { type: String },
  sessionId: { type: String }
});

// Create indexes for faster queries and analytics
eventLogSchema.index({ timestamp: 1 });
eventLogSchema.index({ level: 1, timestamp: 1 });
eventLogSchema.index({ category: 1, timestamp: 1 });
eventLogSchema.index({ userId: 1, timestamp: 1 });
eventLogSchema.index({ resourceId: 1, timestamp: 1 });

export const EventLog = mongoose.model<IEventLog>('EventLog', eventLogSchema);
