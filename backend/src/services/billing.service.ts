import { v4 as uuidv4 } from 'uuid';
import { Billing, Appointment, Patient, Doctor, EventLog } from '../models';
import { WhatsAppService } from './whatsapp.service';

export interface CreateBillingData {
  appointmentId: string;
  doctorId: string;
  patientId: string;
  amount: number;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  dueDate: Date;
  currency?: string;
  taxPercentage?: number;
}

export interface UpdateBillingData {
  amount?: number;
  status?: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paidDate?: Date;
  paymentDetails?: {
    method: 'transfer' | 'cash' | 'card' | 'other';
    transactionId?: string;
    amount: number;
    currency: string;
    notes?: string;
  };
  invoiceUrl?: string;
}

export interface BillingWithDetails {
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
  patientName: string;
  patientPhone: string;
  doctorName: string;
  doctorSpecialization: string;
  appointmentDate: Date;
  appointmentType: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BillingStatistics {
  totalBilling: number;
  pendingAmount: number;
  paidAmount: number;
  overdueAmount: number;
  billingByStatus: Record<string, number>;
  billingByMonth: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
}

export class BillingService {
  /**
   * Generate invoice number
   */
  private static generateInvoiceNumber(doctorId: string): string {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `INV-${doctorId.slice(0, 4)}-${timestamp}-${random}`;
  }

  /**
   * Create a new billing record
   */
  static async createBilling(billingData: CreateBillingData): Promise<BillingWithDetails> {
    try {
      // Verify appointment exists
      const appointment = await Appointment.findOne({ 
        id: billingData.appointmentId, 
        doctorId: billingData.doctorId 
      });
      
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Get doctor and patient details
      const [doctor, patient] = await Promise.all([
        Doctor.findOne({ id: billingData.doctorId, isActive: true }),
        Patient.findOne({ id: billingData.patientId, doctorId: billingData.doctorId, isActive: true })
      ]);

      if (!doctor || !patient) {
        throw new Error('Doctor or patient not found');
      }

      // Calculate tax and total
      const taxPercentage = billingData.taxPercentage || doctor.billingPreferences.taxPercentage || 0;
      const taxAmount = (billingData.amount * taxPercentage) / 100;
      const totalAmount = billingData.amount + taxAmount;

      // Create billing record
      const billing = new Billing({
        id: uuidv4(),
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

      await billing.save();

      // Log the event
      await EventLog.create({
        id: uuidv4(),
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

      return await this.getBillingWithDetails(billing.id);
    } catch (error) {
      throw new Error(`Failed to create billing: ${error}`);
    }
  }

  /**
   * Get billing with patient and doctor details
   */
  static async getBillingWithDetails(billingId: string): Promise<BillingWithDetails> {
    try {
      const billing = await Billing.findById(billingId);
      if (!billing) {
        throw new Error('Billing not found');
      }

      const [appointment, patient, doctor] = await Promise.all([
        Appointment.findOne({ id: billing.appointmentId }),
        Patient.findOne({ id: billing.patientId }),
        Doctor.findOne({ id: billing.doctorId })
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
    } catch (error) {
      throw new Error(`Failed to get billing details: ${error}`);
    }
  }

  /**
   * Get billing records for a doctor
   */
  static async getBillingByDoctor(
    doctorId: string,
    status?: string,
    startDate?: Date,
    endDate?: Date,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    billing: BillingWithDetails[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const query: any = { doctorId };

      if (status) {
        query.status = status;
      }

      if (startDate && endDate) {
        query.dueDate = { $gte: startDate, $lte: endDate };
      } else if (startDate) {
        query.dueDate = { $gte: startDate };
      } else if (endDate) {
        query.dueDate = { $lte: endDate };
      }

      const [billingRecords, total] = await Promise.all([
        Billing.find(query)
          .sort({ dueDate: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Billing.countDocuments(query)
      ]);

      const totalPages = Math.ceil(total / limit);

      // Get details for each billing record
      const billingWithDetails = await Promise.all(
        billingRecords.map(billing => this.getBillingWithDetails(billing.id))
      );

      return {
        billing: billingWithDetails,
        total,
        page,
        totalPages
      };
    } catch (error) {
      throw new Error(`Failed to get billing records: ${error}`);
    }
  }

  /**
   * Get billing records for a patient
   */
  static async getBillingByPatient(
    patientId: string,
    doctorId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    billing: BillingWithDetails[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const [billingRecords, total] = await Promise.all([
        Billing.find({ patientId, doctorId })
          .sort({ dueDate: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Billing.countDocuments({ patientId, doctorId })
      ]);

      const totalPages = Math.ceil(total / limit);

      // Get details for each billing record
      const billingWithDetails = await Promise.all(
        billingRecords.map(billing => this.getBillingWithDetails(billing.id))
      );

      return {
        billing: billingWithDetails,
        total,
        page,
        totalPages
      };
    } catch (error) {
      throw new Error(`Failed to get patient billing: ${error}`);
    }
  }

  /**
   * Update billing record
   */
  static async updateBilling(
    billingId: string,
    doctorId: string,
    updateData: UpdateBillingData
  ): Promise<BillingWithDetails> {
    try {
      const billing = await Billing.findOne({ id: billingId, doctorId });
      if (!billing) {
        throw new Error('Billing not found');
      }

      // Update fields
      if (updateData.amount !== undefined) {
        billing.amount = updateData.amount;
        // Recalculate tax and total
        const doctor = await Doctor.findOne({ id: doctorId });
        const taxPercentage = doctor?.billingPreferences.taxPercentage || 0;
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

      await billing.save();

      // Log the event
      await EventLog.create({
        id: uuidv4(),
        level: 'info',
        category: 'billing',
        action: 'billing_updated',
        userId: doctorId,
        userType: 'doctor',
        resourceId: billingId,
        resourceType: 'billing',
        details: { updatedFields: Object.keys(updateData) }
      });

      return await this.getBillingWithDetails(billingId);
    } catch (error) {
      throw new Error(`Failed to update billing: ${error}`);
    }
  }

  /**
   * Mark billing as paid
   */
  static async markAsPaid(
    billingId: string,
    doctorId: string,
    paymentDetails: {
      method: 'transfer' | 'cash' | 'card' | 'other';
      transactionId?: string;
      amount: number;
      currency: string;
      notes?: string;
    }
  ): Promise<BillingWithDetails> {
    try {
      const billing = await Billing.findOne({ id: billingId, doctorId });
      if (!billing) {
        throw new Error('Billing not found');
      }

      if (billing.status === 'paid') {
        throw new Error('Billing is already marked as paid');
      }

      billing.status = 'paid';
      billing.paidDate = new Date();
      billing.paymentDetails = paymentDetails;

      await billing.save();

      // Log the event
      await EventLog.create({
        id: uuidv4(),
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

      return await this.getBillingWithDetails(billingId);
    } catch (error) {
      throw new Error(`Failed to mark billing as paid: ${error}`);
    }
  }

  /**
   * Send payment reminder
   */
  static async sendPaymentReminder(billingId: string, doctorId: string): Promise<{ success: boolean; message: string }> {
    try {
      const billing = await Billing.findOne({ id: billingId, doctorId });
      if (!billing) {
        throw new Error('Billing not found');
      }

      if (billing.status === 'paid') {
        throw new Error('Cannot send reminder for paid billing');
      }

      const [patient, doctor] = await Promise.all([
        Patient.findOne({ id: billing.patientId }),
        Doctor.findOne({ id: doctorId })
      ]);

      if (!patient || !doctor) {
        throw new Error('Patient or doctor not found');
      }

      // Send WhatsApp reminder if enabled
      if (patient.communicationPreferences?.whatsappEnabled) {
        try {
          await WhatsAppService.sendPaymentReminder(
            patient.phone,
            {
              amount: billing.totalAmount,
              dueDate: billing.dueDate.toLocaleDateString('es-CL'),
              invoiceNumber: billing.invoiceNumber,
              doctorName: doctor.name
            },
            doctor.id
          );

          // Update reminder status
          billing.reminderSent = true;
          billing.reminderSentAt = new Date();
          await billing.save();

          // Log the event
          await EventLog.create({
            id: uuidv4(),
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
        } catch (error) {
          throw new Error(`Failed to send WhatsApp reminder: ${error}`);
        }
      } else {
        return { success: false, message: 'WhatsApp notifications not enabled for this patient' };
      }
    } catch (error) {
      throw new Error(`Failed to send payment reminder: ${error}`);
    }
  }

  /**
   * Get billing statistics for a doctor
   */
  static async getBillingStatistics(
    doctorId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<BillingStatistics> {
    try {
      const query: any = { doctorId };

      if (startDate && endDate) {
        query.dueDate = { $gte: startDate, $lte: endDate };
      } else if (startDate) {
        query.dueDate = { $gte: startDate };
      } else if (endDate) {
        query.dueDate = { $lte: endDate };
      }

      const [totalBilling, billingByStatus, billingByMonth] = await Promise.all([
        Billing.aggregate([
          { $match: query },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]),
        Billing.aggregate([
          { $match: query },
          { $group: { _id: '$status', total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
        ]),
        Billing.aggregate([
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
      const total = totalBilling[0]?.total || 0;
      const statusStats: Record<string, number> = {};
      let pendingAmount = 0;
      let paidAmount = 0;
      let overdueAmount = 0;

      billingByStatus.forEach((item: any) => {
        statusStats[item._id] = item.total;
        if (item._id === 'pending') pendingAmount = item.total;
        if (item._id === 'paid') paidAmount = item.total;
        if (item._id === 'overdue') overdueAmount = item.total;
      });

      // Format monthly data
      const monthlyData = billingByMonth.map((item: any) => ({
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
    } catch (error) {
      throw new Error(`Failed to get billing statistics: ${error}`);
    }
  }

  /**
   * Process overdue billing
   */
  static async processOverdueBilling(doctorId: string): Promise<{ processed: number; errors: number }> {
    try {
      const now = new Date();
      const overdueBilling = await Billing.find({
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
          await billing.save();

          // Send reminder
          await this.sendPaymentReminder(billing.id, doctorId);
          processed++;
        } catch (error) {
          console.error(`Failed to process overdue billing ${billing.id}:`, error);
          errors++;
        }
      }

      return { processed, errors };
    } catch (error) {
      throw new Error(`Failed to process overdue billing: ${error}`);
    }
  }
}
