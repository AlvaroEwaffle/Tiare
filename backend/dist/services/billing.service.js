"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const uuid_1 = require("uuid");
const models_1 = require("../models");
const whatsapp_service_1 = require("./whatsapp.service");
class BillingService {
    /**
     * Generate invoice number
     */
    static generateInvoiceNumber(doctorId) {
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `INV-${doctorId.slice(0, 4)}-${timestamp}-${random}`;
    }
    /**
     * Create a new billing record
     */
    static createBilling(billingData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Verify appointment exists
                const appointment = yield models_1.Appointment.findOne({
                    id: billingData.appointmentId,
                    doctorId: billingData.doctorId
                });
                if (!appointment) {
                    throw new Error('Appointment not found');
                }
                // Get doctor and patient details
                const [doctor, patient] = yield Promise.all([
                    models_1.Doctor.findOne({ id: billingData.doctorId, isActive: true }),
                    models_1.Patient.findOne({ id: billingData.patientId, doctorId: billingData.doctorId, isActive: true })
                ]);
                if (!doctor || !patient) {
                    throw new Error('Doctor or patient not found');
                }
                // Calculate tax and total
                const taxPercentage = billingData.taxPercentage || doctor.billingPreferences.taxPercentage || 0;
                const taxAmount = (billingData.amount * taxPercentage) / 100;
                const totalAmount = billingData.amount + taxAmount;
                // Create billing record
                const billing = new models_1.Billing({
                    id: (0, uuid_1.v4)(),
                    appointmentId: billingData.appointmentId,
                    doctorId: billingData.doctorId,
                    patientId: billingData.patientId,
                    invoiceNumber: this.generateInvoiceNumber(billingData.doctorId),
                    amount: billingData.amount,
                    taxAmount: taxAmount,
                    totalAmount: totalAmount,
                    currency: billingData.currency || doctor.billingPreferences.defaultCurrency || 'CLP',
                    status: 'pending',
                    dueDate: billingData.dueDate,
                    items: billingData.items
                });
                yield billing.save();
                // Log the event
                yield models_1.EventLog.create({
                    id: (0, uuid_1.v4)(),
                    level: 'info',
                    category: 'billing',
                    action: 'billing_created',
                    userId: billingData.doctorId,
                    userType: 'doctor',
                    resourceId: billing.id,
                    resourceType: 'billing',
                    details: {
                        amount: billingData.amount,
                        invoiceNumber: billing.invoiceNumber
                    }
                });
                return yield this.getBillingWithDetails(billing.id);
            }
            catch (error) {
                throw new Error(`Failed to create billing: ${error}`);
            }
        });
    }
    /**
     * Get billing with patient and doctor details
     */
    static getBillingWithDetails(billingId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const billing = yield models_1.Billing.findById(billingId);
                if (!billing) {
                    throw new Error('Billing not found');
                }
                const [appointment, patient, doctor] = yield Promise.all([
                    models_1.Appointment.findOne({ id: billing.appointmentId }),
                    models_1.Patient.findOne({ id: billing.patientId }),
                    models_1.Doctor.findOne({ id: billing.doctorId })
                ]);
                if (!appointment || !patient || !doctor) {
                    throw new Error('Appointment, patient, or doctor not found');
                }
                return {
                    id: billing.id,
                    appointmentId: billing.appointmentId,
                    doctorId: billing.doctorId,
                    patientId: billing.patientId,
                    invoiceNumber: billing.invoiceNumber,
                    amount: billing.amount,
                    taxAmount: billing.taxAmount,
                    totalAmount: billing.totalAmount,
                    currency: billing.currency,
                    status: billing.status,
                    dueDate: billing.dueDate,
                    paidDate: billing.paidDate,
                    items: billing.items,
                    paymentDetails: billing.paymentDetails,
                    invoiceUrl: billing.invoiceUrl,
                    reminderSent: billing.reminderSent,
                    reminderSentAt: billing.reminderSentAt,
                    patientName: patient.name,
                    patientPhone: patient.phone,
                    doctorName: doctor.name,
                    doctorSpecialization: doctor.specialization,
                    appointmentDate: appointment.dateTime,
                    appointmentType: appointment.type,
                    createdAt: billing.createdAt,
                    updatedAt: billing.updatedAt
                };
            }
            catch (error) {
                throw new Error(`Failed to get billing details: ${error}`);
            }
        });
    }
    /**
     * Get billing records for a doctor
     */
    static getBillingByDoctor(doctorId_1, status_1, startDate_1, endDate_1) {
        return __awaiter(this, arguments, void 0, function* (doctorId, status, startDate, endDate, page = 1, limit = 20) {
            try {
                const skip = (page - 1) * limit;
                const query = { doctorId };
                if (status) {
                    query.status = status;
                }
                if (startDate && endDate) {
                    query.dueDate = { $gte: startDate, $lte: endDate };
                }
                else if (startDate) {
                    query.dueDate = { $gte: startDate };
                }
                else if (endDate) {
                    query.dueDate = { $lte: endDate };
                }
                const [billingRecords, total] = yield Promise.all([
                    models_1.Billing.find(query)
                        .sort({ dueDate: 1 })
                        .skip(skip)
                        .limit(limit)
                        .lean(),
                    models_1.Billing.countDocuments(query)
                ]);
                const totalPages = Math.ceil(total / limit);
                // Get details for each billing record
                const billingWithDetails = yield Promise.all(billingRecords.map(billing => this.getBillingWithDetails(billing.id)));
                return {
                    billing: billingWithDetails,
                    total,
                    page,
                    totalPages
                };
            }
            catch (error) {
                throw new Error(`Failed to get billing records: ${error}`);
            }
        });
    }
    /**
     * Get billing records for a patient
     */
    static getBillingByPatient(patientId_1, doctorId_1) {
        return __awaiter(this, arguments, void 0, function* (patientId, doctorId, page = 1, limit = 20) {
            try {
                const skip = (page - 1) * limit;
                const [billingRecords, total] = yield Promise.all([
                    models_1.Billing.find({ patientId, doctorId })
                        .sort({ dueDate: -1 })
                        .skip(skip)
                        .limit(limit)
                        .lean(),
                    models_1.Billing.countDocuments({ patientId, doctorId })
                ]);
                const totalPages = Math.ceil(total / limit);
                // Get details for each billing record
                const billingWithDetails = yield Promise.all(billingRecords.map(billing => this.getBillingWithDetails(billing.id)));
                return {
                    billing: billingWithDetails,
                    total,
                    page,
                    totalPages
                };
            }
            catch (error) {
                throw new Error(`Failed to get patient billing: ${error}`);
            }
        });
    }
    /**
     * Update billing record
     */
    static updateBilling(billingId, doctorId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const billing = yield models_1.Billing.findOne({ id: billingId, doctorId });
                if (!billing) {
                    throw new Error('Billing not found');
                }
                // Update fields
                if (updateData.amount !== undefined) {
                    billing.amount = updateData.amount;
                    // Recalculate tax and total
                    const doctor = yield models_1.Doctor.findOne({ id: doctorId });
                    const taxPercentage = (doctor === null || doctor === void 0 ? void 0 : doctor.billingPreferences.taxPercentage) || 0;
                    billing.taxAmount = (updateData.amount * taxPercentage) / 100;
                    billing.totalAmount = updateData.amount + billing.taxAmount;
                }
                if (updateData.status) {
                    billing.status = updateData.status;
                }
                if (updateData.paidDate) {
                    billing.paidDate = updateData.paidDate;
                }
                if (updateData.paymentDetails) {
                    billing.paymentDetails = updateData.paymentDetails;
                }
                if (updateData.invoiceUrl) {
                    billing.invoiceUrl = updateData.invoiceUrl;
                }
                yield billing.save();
                // Log the event
                yield models_1.EventLog.create({
                    id: (0, uuid_1.v4)(),
                    level: 'info',
                    category: 'billing',
                    action: 'billing_updated',
                    userId: doctorId,
                    userType: 'doctor',
                    resourceId: billingId,
                    resourceType: 'billing',
                    details: { updatedFields: Object.keys(updateData) }
                });
                return yield this.getBillingWithDetails(billingId);
            }
            catch (error) {
                throw new Error(`Failed to update billing: ${error}`);
            }
        });
    }
    /**
     * Mark billing as paid
     */
    static markAsPaid(billingId, doctorId, paymentDetails) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const billing = yield models_1.Billing.findOne({ id: billingId, doctorId });
                if (!billing) {
                    throw new Error('Billing not found');
                }
                if (billing.status === 'paid') {
                    throw new Error('Billing is already marked as paid');
                }
                billing.status = 'paid';
                billing.paidDate = new Date();
                billing.paymentDetails = paymentDetails;
                yield billing.save();
                // Log the event
                yield models_1.EventLog.create({
                    id: (0, uuid_1.v4)(),
                    level: 'info',
                    category: 'billing',
                    action: 'billing_paid',
                    userId: doctorId,
                    userType: 'doctor',
                    resourceId: billingId,
                    resourceType: 'billing',
                    details: {
                        method: paymentDetails.method,
                        amount: paymentDetails.amount
                    }
                });
                return yield this.getBillingWithDetails(billingId);
            }
            catch (error) {
                throw new Error(`Failed to mark billing as paid: ${error}`);
            }
        });
    }
    /**
     * Send payment reminder
     */
    static sendPaymentReminder(billingId, doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const billing = yield models_1.Billing.findOne({ id: billingId, doctorId });
                if (!billing) {
                    throw new Error('Billing not found');
                }
                if (billing.status === 'paid') {
                    throw new Error('Cannot send reminder for paid billing');
                }
                const [patient, doctor] = yield Promise.all([
                    models_1.Patient.findOne({ id: billing.patientId }),
                    models_1.Doctor.findOne({ id: doctorId })
                ]);
                if (!patient || !doctor) {
                    throw new Error('Patient or doctor not found');
                }
                // Send WhatsApp reminder if enabled
                if ((_a = patient.communicationPreferences) === null || _a === void 0 ? void 0 : _a.whatsappEnabled) {
                    try {
                        yield whatsapp_service_1.WhatsAppService.sendPaymentReminder(patient.phone, {
                            amount: billing.totalAmount,
                            dueDate: billing.dueDate.toLocaleDateString('es-CL'),
                            invoiceNumber: billing.invoiceNumber,
                            doctorName: doctor.name
                        }, doctor.id);
                        // Update reminder status
                        billing.reminderSent = true;
                        billing.reminderSentAt = new Date();
                        yield billing.save();
                        // Log the event
                        yield models_1.EventLog.create({
                            id: (0, uuid_1.v4)(),
                            level: 'info',
                            category: 'billing',
                            action: 'payment_reminder_sent',
                            userId: doctorId,
                            userType: 'doctor',
                            resourceId: billingId,
                            resourceType: 'billing',
                            details: { method: 'whatsapp' }
                        });
                        return { success: true, message: 'Payment reminder sent successfully' };
                    }
                    catch (error) {
                        throw new Error(`Failed to send WhatsApp reminder: ${error}`);
                    }
                }
                else {
                    return { success: false, message: 'WhatsApp notifications not enabled for this patient' };
                }
            }
            catch (error) {
                throw new Error(`Failed to send payment reminder: ${error}`);
            }
        });
    }
    /**
     * Get billing statistics for a doctor
     */
    static getBillingStatistics(doctorId, startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const query = { doctorId };
                if (startDate && endDate) {
                    query.dueDate = { $gte: startDate, $lte: endDate };
                }
                else if (startDate) {
                    query.dueDate = { $gte: startDate };
                }
                else if (endDate) {
                    query.dueDate = { $lte: endDate };
                }
                const [totalBilling, billingByStatus, billingByMonth] = yield Promise.all([
                    models_1.Billing.aggregate([
                        { $match: query },
                        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
                    ]),
                    models_1.Billing.aggregate([
                        { $match: query },
                        { $group: { _id: '$status', total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
                    ]),
                    models_1.Billing.aggregate([
                        { $match: query },
                        {
                            $group: {
                                _id: {
                                    year: { $year: '$dueDate' },
                                    month: { $month: '$dueDate' }
                                },
                                amount: { $sum: '$totalAmount' },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { '_id.year': 1, '_id.month': 1 } }
                    ])
                ]);
                // Calculate totals
                const total = ((_a = totalBilling[0]) === null || _a === void 0 ? void 0 : _a.total) || 0;
                const statusStats = {};
                let pendingAmount = 0;
                let paidAmount = 0;
                let overdueAmount = 0;
                billingByStatus.forEach((item) => {
                    statusStats[item._id] = item.total;
                    if (item._id === 'pending')
                        pendingAmount = item.total;
                    if (item._id === 'paid')
                        paidAmount = item.total;
                    if (item._id === 'overdue')
                        overdueAmount = item.total;
                });
                // Format monthly data
                const monthlyData = billingByMonth.map((item) => ({
                    month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
                    amount: item.amount,
                    count: item.count
                }));
                return {
                    totalBilling: total,
                    pendingAmount,
                    paidAmount,
                    overdueAmount,
                    billingByStatus: statusStats,
                    billingByMonth: monthlyData
                };
            }
            catch (error) {
                throw new Error(`Failed to get billing statistics: ${error}`);
            }
        });
    }
    /**
     * Process overdue billing
     */
    static processOverdueBilling(doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const now = new Date();
                const overdueBilling = yield models_1.Billing.find({
                    doctorId,
                    status: 'pending',
                    dueDate: { $lt: now },
                    reminderSent: false
                });
                let processed = 0;
                let errors = 0;
                for (const billing of overdueBilling) {
                    try {
                        // Update status to overdue
                        billing.status = 'overdue';
                        yield billing.save();
                        // Send reminder
                        yield this.sendPaymentReminder(billing.id, doctorId);
                        processed++;
                    }
                    catch (error) {
                        console.error(`Failed to process overdue billing ${billing.id}:`, error);
                        errors++;
                    }
                }
                return { processed, errors };
            }
            catch (error) {
                throw new Error(`Failed to process overdue billing: ${error}`);
            }
        });
    }
}
exports.BillingService = BillingService;
