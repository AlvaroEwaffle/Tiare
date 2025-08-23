import mongoose, { Document, Schema } from 'mongoose';

// Sub-schemas for nested objects
const PaymentDetailsSchema = new Schema({
  method: { type: String, enum: ['transfer', 'cash', 'card', 'other'], required: true },
  transactionId: { type: String },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'CLP' },
  paidAt: { type: Date },
  notes: { type: String }
});

const InvoiceItemSchema = new Schema({
  description: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, required: true },
  total: { type: Number, required: true }
});

export interface IBilling extends Document {
  id: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  invoiceNumber: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  paidDate?: Date;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  paymentDetails?: {
    method: 'transfer' | 'cash' | 'card' | 'other';
    transactionId?: string;
    amount: number;
    currency: string;
    paidAt?: Date;
    notes?: string;
  };
  invoiceUrl?: string;
  reminderSent: boolean;
  reminderSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const billingSchema = new Schema<IBilling>({
  id: { type: String, required: true, unique: true },
  appointmentId: { type: String, required: true },
  doctorId: { type: String, required: true },
  patientId: { type: String, required: true },
  invoiceNumber: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  taxAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: 'CLP' },
  status: { 
    type: String, 
    enum: ['pending', 'paid', 'overdue', 'cancelled'], 
    default: 'pending' 
  },
  dueDate: { type: Date, required: true },
  paidDate: { type: Date },
  items: [{ type: InvoiceItemSchema, required: true }],
  paymentDetails: { type: PaymentDetailsSchema },
  invoiceUrl: { type: String },
  reminderSent: { type: Boolean, default: false },
  reminderSentAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
billingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create indexes for faster queries
billingSchema.index({ doctorId: 1, status: 1 });
billingSchema.index({ patientId: 1, status: 1 });
billingSchema.index({ dueDate: 1, status: 1 });
billingSchema.index({ invoiceNumber: 1 });

export const Billing = mongoose.model<IBilling>('Billing', billingSchema);
