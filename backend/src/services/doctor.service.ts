import { v4 as uuidv4 } from 'uuid';
import { Doctor, EventLog } from '../models';
import { AuthService } from './auth.service';
import { GoogleCalendarService } from './googleCalendar.service';

export interface CreateDoctorData {
  name: string;
  email: string;
  password: string;
  specialization: string;
  licenseNumber: string;
  phone: string;
  address?: string;
}

export interface UpdateDoctorData {
  name?: string;
  specialization?: string;
  phone?: string;
  address?: string;
  practiceSettings?: {
    appointmentDuration?: number;
    maxAppointmentsPerDay?: number;
    workingHours?: {
      [key: string]: { start: string; end: string; available: boolean };
    };
    consultationTypes?: Array<{
      type: 'presential' | 'remote' | 'home';
      price: number;
      duration: number;
    }>;
    cancellationPolicy?: {
      hoursNotice: number;
      penaltyPercentage: number;
    };
  };
  billingPreferences?: {
    billingCycle?: 'daily' | 'weekly' | 'monthly';
    automaticReminders?: boolean;
    reminder24hBefore?: boolean;
    reminder2hBefore?: boolean;
    reminderAfterAppointment?: boolean;
    paymentMethods?: string[];
    defaultCurrency?: string;
    taxPercentage?: number;
  };
}

export interface DoctorProfile {
  id: string;
  name: string;
  email: string;
  specialization: string;
  licenseNumber: string;
  phone: string;
  address?: string;
  practiceSettings: any;
  billingPreferences: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class DoctorService {
  /**
   * Create a new doctor
   */
  static async createDoctor(doctorData: CreateDoctorData): Promise<{ doctor: DoctorProfile; tokens: any }> {
    try {
      // Check if doctor already exists
      const existingDoctor = await Doctor.findOne({
        $or: [{ email: doctorData.email }, { licenseNumber: doctorData.licenseNumber }]
      });

      if (existingDoctor) {
        throw new Error('Doctor with this email or license number already exists');
      }

      // Create doctor with authentication
      const { doctor, tokens } = await AuthService.registerDoctor(doctorData);

      // Log the event
      await EventLog.create({
        id: uuidv4(),
        level: 'info',
        category: 'doctor',
        action: 'doctor_created',
        userId: doctor.id,
        userType: 'doctor',
        resourceId: doctor.id,
        resourceType: 'doctor',
        details: { email: doctor.email, specialization: doctor.specialization }
      });

      return { doctor, tokens };
    } catch (error) {
      throw new Error(`Failed to create doctor: ${error}`);
    }
  }

  /**
   * Get doctor by ID
   */
  static async getDoctorById(doctorId: string): Promise<DoctorProfile | null> {
    try {
      const doctor = await Doctor.findOne({ id: doctorId, isActive: true });
      if (!doctor) return null;

      return {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        specialization: doctor.specialization,
        licenseNumber: doctor.licenseNumber,
        phone: doctor.phone,
        address: doctor.address,
        practiceSettings: doctor.practiceSettings,
        billingPreferences: doctor.billingPreferences,
        isActive: doctor.isActive,
        createdAt: doctor.createdAt,
        updatedAt: doctor.updatedAt
      };
    } catch (error) {
      throw new Error(`Failed to get doctor: ${error}`);
    }
  }

  /**
   * Get doctor by email
   */
  static async getDoctorByEmail(email: string): Promise<DoctorProfile | null> {
    try {
      const doctor = await Doctor.findOne({ email, isActive: true });
      if (!doctor) return null;

      return {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        specialization: doctor.specialization,
        licenseNumber: doctor.licenseNumber,
        phone: doctor.phone,
        address: doctor.address,
        practiceSettings: doctor.practiceSettings,
        billingPreferences: doctor.billingPreferences,
        isActive: doctor.isActive,
        createdAt: doctor.createdAt,
        updatedAt: doctor.updatedAt
      };
    } catch (error) {
      throw new Error(`Failed to get doctor by email: ${error}`);
    }
  }

  /**
   * Update doctor profile
   */
  static async updateDoctor(doctorId: string, updateData: UpdateDoctorData): Promise<DoctorProfile> {
    try {
      const doctor = await Doctor.findOne({ id: doctorId, isActive: true });
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      // Update fields
      if (updateData.name) doctor.name = updateData.name;
      if (updateData.specialization) doctor.specialization = updateData.specialization;
      if (updateData.phone) doctor.phone = updateData.phone;
      if (updateData.address !== undefined) doctor.address = updateData.address;

      // Update practice settings
      if (updateData.practiceSettings) {
        if (updateData.practiceSettings.appointmentDuration !== undefined) {
          doctor.practiceSettings.appointmentDuration = updateData.practiceSettings.appointmentDuration;
        }
        if (updateData.practiceSettings.maxAppointmentsPerDay !== undefined) {
          doctor.practiceSettings.maxAppointmentsPerDay = updateData.practiceSettings.maxAppointmentsPerDay;
        }
        if (updateData.practiceSettings.workingHours) {
          doctor.practiceSettings.workingHours = {
            ...doctor.practiceSettings.workingHours,
            ...updateData.practiceSettings.workingHours
          };
        }
        if (updateData.practiceSettings.consultationTypes) {
          doctor.practiceSettings.consultationTypes = updateData.practiceSettings.consultationTypes;
        }
        if (updateData.practiceSettings.cancellationPolicy) {
          doctor.practiceSettings.cancellationPolicy = {
            ...doctor.practiceSettings.cancellationPolicy,
            ...updateData.practiceSettings.cancellationPolicy
          };
        }
      }

      // Update billing preferences
      if (updateData.billingPreferences) {
        Object.assign(doctor.billingPreferences, updateData.billingPreferences);
      }

      await doctor.save();

      // Log the event
      await EventLog.create({
        id: uuidv4(),
        level: 'info',
        category: 'doctor',
        action: 'doctor_updated',
        userId: doctorId,
        userType: 'doctor',
        resourceId: doctorId,
        resourceType: 'doctor',
        details: { updatedFields: Object.keys(updateData) }
      });

      return {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email,
        specialization: doctor.specialization,
        licenseNumber: doctor.licenseNumber,
        phone: doctor.phone,
        address: doctor.address,
        practiceSettings: doctor.practiceSettings,
        billingPreferences: doctor.billingPreferences,
        isActive: doctor.isActive,
        createdAt: doctor.createdAt,
        updatedAt: doctor.updatedAt
      };
    } catch (error) {
      throw new Error(`Failed to update doctor: ${error}`);
    }
  }

  /**
   * Connect Google Calendar
   */
  static async connectGoogleCalendar(doctorId: string, authCode: string): Promise<{ success: boolean; message: string }> {
    try {
      const doctor = await Doctor.findOne({ id: doctorId, isActive: true });
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      // Exchange auth code for tokens
      const tokens = await GoogleCalendarService.exchangeCodeForTokens(authCode);

      // Update doctor with Google Calendar info
      doctor.googleCalendarId = doctor.email; // Use email as default calendar ID
      doctor.googleRefreshToken = tokens.refreshToken;

      await doctor.save();

      // Log the event
      await EventLog.create({
        id: uuidv4(),
        level: 'info',
        category: 'calendar',
        action: 'google_calendar_connected',
        userId: doctorId,
        userType: 'doctor',
        resourceId: doctorId,
        resourceType: 'doctor',
        details: { calendarId: doctor.googleCalendarId }
      });

      return { success: true, message: 'Google Calendar connected successfully' };
    } catch (error) {
      throw new Error(`Failed to connect Google Calendar: ${error}`);
    }
  }

  /**
   * Disconnect Google Calendar
   */
  static async disconnectGoogleCalendar(doctorId: string): Promise<{ success: boolean; message: string }> {
    try {
      const doctor = await Doctor.findOne({ id: doctorId, isActive: true });
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      // Clear Google Calendar info
      doctor.googleCalendarId = undefined;
      doctor.googleRefreshToken = undefined;

      await doctor.save();

      // Log the event
      await EventLog.create({
        id: uuidv4(),
        level: 'info',
        category: 'calendar',
        action: 'google_calendar_disconnected',
        userId: doctorId,
        userType: 'doctor',
        resourceId: doctorId,
        resourceType: 'doctor',
        details: {}
      });

      return { success: true, message: 'Google Calendar disconnected successfully' };
    } catch (error) {
      throw new Error(`Failed to disconnect Google Calendar: ${error}`);
    }
  }

  /**
   * Get doctor's working hours
   */
  static async getWorkingHours(doctorId: string): Promise<any> {
    try {
      const doctor = await Doctor.findOne({ id: doctorId, isActive: true });
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      return doctor.practiceSettings.workingHours;
    } catch (error) {
      throw new Error(`Failed to get working hours: ${error}`);
    }
  }

  /**
   * Update working hours
   */
  static async updateWorkingHours(doctorId: string, workingHours: any): Promise<any> {
    try {
      const doctor = await Doctor.findOne({ id: doctorId, isActive: true });
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      doctor.practiceSettings.workingHours = workingHours;
      await doctor.save();

      // Log the event
      await EventLog.create({
        id: uuidv4(),
        level: 'info',
        category: 'doctor',
        action: 'working_hours_updated',
        userId: doctorId,
        userType: 'doctor',
        resourceId: doctorId,
        resourceType: 'doctor',
        details: { workingHours }
      });

      return workingHours;
    } catch (error) {
      throw new Error(`Failed to update working hours: ${error}`);
    }
  }

  /**
   * Get consultation types and prices
   */
  static async getConsultationTypes(doctorId: string): Promise<any[]> {
    try {
      const doctor = await Doctor.findOne({ id: doctorId, isActive: true });
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      return doctor.practiceSettings.consultationTypes || [];
    } catch (error) {
      throw new Error(`Failed to get consultation types: ${error}`);
    }
  }

  /**
   * Update consultation types
   */
  static async updateConsultationTypes(doctorId: string, consultationTypes: any[]): Promise<any[]> {
    try {
      const doctor = await Doctor.findOne({ id: doctorId, isActive: true });
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      doctor.practiceSettings.consultationTypes = consultationTypes;
      await doctor.save();

      // Log the event
      await EventLog.create({
        id: uuidv4(),
        level: 'info',
        category: 'doctor',
        action: 'consultation_types_updated',
        userId: doctorId,
        userType: 'doctor',
        resourceId: doctorId,
        resourceType: 'doctor',
        details: { consultationTypes }
      });

      return consultationTypes;
    } catch (error) {
      throw new Error(`Failed to update consultation types: ${error}`);
    }
  }

  /**
   * Deactivate doctor account
   */
  static async deactivateDoctor(doctorId: string): Promise<{ success: boolean; message: string }> {
    try {
      const doctor = await Doctor.findOne({ id: doctorId, isActive: true });
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      doctor.isActive = false;
      await doctor.save();

      // Log the event
      await EventLog.create({
        id: uuidv4(),
        level: 'warning',
        category: 'doctor',
        action: 'doctor_deactivated',
        userId: doctorId,
        userType: 'doctor',
        resourceId: doctorId,
        resourceType: 'doctor',
        details: {}
      });

      return { success: true, message: 'Doctor account deactivated successfully' };
    } catch (error) {
      throw new Error(`Failed to deactivate doctor: ${error}`);
    }
  }

  /**
   * Reactivate doctor account
   */
  static async reactivateDoctor(doctorId: string): Promise<{ success: boolean; message: string }> {
    try {
      const doctor = await Doctor.findOne({ id: doctorId, isActive: false });
      if (!doctor) {
        throw new Error('Doctor not found or already active');
      }

      doctor.isActive = true;
      await doctor.save();

      // Log the event
      await EventLog.create({
        id: uuidv4(),
        level: 'info',
        category: 'doctor',
        action: 'doctor_reactivated',
        userId: doctorId,
        userType: 'doctor',
        resourceId: doctorId,
        resourceType: 'doctor',
        details: {}
      });

      return { success: true, message: 'Doctor account reactivated successfully' };
    } catch (error) {
      throw new Error(`Failed to reactivate doctor: ${error}`);
    }
  }
}
