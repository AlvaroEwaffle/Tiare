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
exports.Billing = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Sub-schemas for nested objects
const PaymentDetailsSchema = new mongoose_1.Schema({
    method: { type: String, enum: ['transfer', 'cash', 'card', 'other'], required: true },
    transactionId: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'CLP' },
    paidAt: { type: Date },
    notes: { type: String }
});
const InvoiceItemSchema = new mongoose_1.Schema({
    description: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true }
});
const billingSchema = new mongoose_1.Schema({
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
billingSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});
// Create indexes for faster queries (avoiding duplicates with unique: true fields)
billingSchema.index({ doctorId: 1, status: 1 });
billingSchema.index({ patientId: 1, status: 1 });
billingSchema.index({ dueDate: 1, status: 1 });
exports.Billing = mongoose_1.default.model('Billing', billingSchema);
exports.default = exports.Billing;
