import { v4 as uuidv4 } from 'uuid';
import { Patient, EventLog, Doctor } from '../models';

export interface CreatePatientData {
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
}

export interface UpdatePatientData {
  name?: string;
  phone?: string;
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
  communicationPreferences?: {
    preferredLanguage?: string;
    whatsappEnabled?: boolean;
    emailEnabled?: boolean;
    smsEnabled?: boolean;
    reminderPreferences?: {
      appointment24h?: boolean;
      appointment2h?: boolean;
      paymentReminders?: boolean;
      followUpReminders?: boolean;
    };
  };
}

export interface PatientProfile {
  id: string;
  doctorId: string;
  name: string;
  phone: string;
  email?: string;
  dateOfBirth?: Date;
  gender?: string;
  address?: string;
  emergencyContact?: any;
  medicalHistory: any[];
  communicationPreferences: any;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalNoteData {
  date: Date;
  note: string;
  type: 'consultation' | 'observation' | 'prescription' | 'test_result';
  doctorId: string;
}

export class PatientService {
  /**
   * Create a new patient
   */
  static async createPatient(patientData: CreatePatientData): Promise<PatientProfile> {
    try {
      // Verify doctor exists
      const doctor = await Doctor.findOne({ id: patientData.doctorId, isActive: true });
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      // Check if patient already exists with same phone for this doctor
      const existingPatient = await Patient.findOne({
        doctorId: patientData.doctorId,
        phone: patientData.phone,
        isActive: true
      });

      if (existingPatient) {
        throw new Error('Patient with this phone number already exists for this doctor');
      }

      // Create patient
      const patient = new Patient({
        id: uuidv4(),
        ...patientData
      });

      await patient.save();

      // Log the event
      await EventLog.create({
        id: uuidv4(),
        level: 'info',
        category: 'patient',
        action: 'patient_created',
        userId: patientData.doctorId,
        userType: 'doctor',
        resourceId: patient.id,
        resourceType: 'patient',
        details: { name: patient.name, phone: patient.phone }
      });

      return {
        id: patient.id,
        doctorId: patient.doctorId,
        name: patient.name,
        phone: patient.phone,
        email: patient.email,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        address: patient.address,
        emergencyContact: patient.emergencyContact,
        medicalHistory: patient.medicalHistory,
        communicationPreferences: patient.communicationPreferences,
        isActive: patient.isActive,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt
      };
    } catch (error) {
      throw new Error(`Failed to create patient: ${error}`);
    }
  }

  /**
   * Get patient by ID
   */
  static async getPatientById(patientId: string, doctorId: string): Promise<PatientProfile | null> {
    try {
      const patient = await Patient.findOne({ id: patientId, doctorId, isActive: true });
      if (!patient) return null;

      return {
        id: patient.id,
        doctorId: patient.doctorId,
        name: patient.name,
        phone: patient.phone,
        email: patient.email,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        address: patient.address,
        emergencyContact: patient.emergencyContact,
        medicalHistory: patient.medicalHistory,
        communicationPreferences: patient.communicationPreferences,
        isActive: patient.isActive,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt
      };
    } catch (error) {
      throw new Error(`Failed to get patient: ${error}`);
    }
  }

  /**
   * Get patient by phone number
   */
  static async getPatientByPhone(phone: string, doctorId: string): Promise<PatientProfile | null> {
    try {
      const patient = await Patient.findOne({ phone, doctorId, isActive: true });
      if (!patient) return null;

      return {
        id: patient.id,
        doctorId: patient.doctorId,
        name: patient.name,
        phone: patient.phone,
        email: patient.email,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        address: patient.address,
        emergencyContact: patient.emergencyContact,
        medicalHistory: patient.medicalHistory,
        communicationPreferences: patient.communicationPreferences,
        isActive: patient.isActive,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt
      };
    } catch (error) {
      throw new Error(`Failed to get patient by phone: ${error}`);
    }
  }

  /**
   * Get all patients for a doctor
   */
  static async getPatientsByDoctor(doctorId: string, page: number = 1, limit: number = 20): Promise<{
    patients: PatientProfile[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const [patients, total] = await Promise.all([
        Patient.find({ doctorId, isActive: true })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Patient.countDocuments({ doctorId, isActive: true })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        patients: patients.map(patient => ({
          id: patient.id,
          doctorId: patient.doctorId,
          name: patient.name,
          phone: patient.phone,
          email: patient.email,
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender,
          address: patient.address,
          emergencyContact: patient.emergencyContact,
          medicalHistory: patient.medicalHistory,
          communicationPreferences: patient.communicationPreferences,
          isActive: patient.isActive,
          createdAt: patient.createdAt,
          updatedAt: patient.updatedAt
        })),
        total,
        page,
        totalPages
      };
    } catch (error) {
      throw new Error(`Failed to get patients: ${error}`);
    }
  }

  /**
   * Search patients by name or phone
   */
  static async searchPatients(
    doctorId: string,
    searchTerm: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    patients: PatientProfile[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const searchQuery = {
        doctorId,
        isActive: true,
        $or: [
          { name: { $regex: searchTerm, $options: 'i' } },
          { phone: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } }
        ]
      };

      const [patients, total] = await Promise.all([
        Patient.find(searchQuery)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Patient.countDocuments(searchQuery)
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        patients: patients.map(patient => ({
          id: patient.id,
          doctorId: patient.doctorId,
          name: patient.name,
          phone: patient.phone,
          email: patient.email,
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender,
          address: patient.address,
          emergencyContact: patient.emergencyContact,
          medicalHistory: patient.medicalHistory,
          communicationPreferences: patient.communicationPreferences,
          isActive: patient.isActive,
          createdAt: patient.createdAt,
          updatedAt: patient.updatedAt
        })),
        total,
        page,
        totalPages
      };
    } catch (error) {
      throw new Error(`Failed to search patients: ${error}`);
    }
  }

  /**
   * Update patient profile
   */
  static async updatePatient(
    patientId: string,
    doctorId: string,
    updateData: UpdatePatientData
  ): Promise<PatientProfile> {
    try {
      const patient = await Patient.findOne({ id: patientId, doctorId, isActive: true });
      if (!patient) {
        throw new Error('Patient not found');
      }

      // Update basic fields
      if (updateData.name) patient.name = updateData.name;
      if (updateData.phone) patient.phone = updateData.phone;
      if (updateData.email !== undefined) patient.email = updateData.email;
      if (updateData.dateOfBirth !== undefined) patient.dateOfBirth = updateData.dateOfBirth;
      if (updateData.gender !== undefined) patient.gender = updateData.gender;
      if (updateData.address !== undefined) patient.address = updateData.address;

      // Update emergency contact
      if (updateData.emergencyContact) {
        patient.emergencyContact = updateData.emergencyContact;
      }

      // Update communication preferences
      if (updateData.communicationPreferences) {
        if (updateData.communicationPreferences.preferredLanguage !== undefined) {
          patient.communicationPreferences.preferredLanguage = updateData.communicationPreferences.preferredLanguage;
        }
        if (updateData.communicationPreferences.whatsappEnabled !== undefined) {
          patient.communicationPreferences.whatsappEnabled = updateData.communicationPreferences.whatsappEnabled;
        }
        if (updateData.communicationPreferences.emailEnabled !== undefined) {
          patient.communicationPreferences.emailEnabled = updateData.communicationPreferences.emailEnabled;
        }
        if (updateData.communicationPreferences.smsEnabled !== undefined) {
          patient.communicationPreferences.smsEnabled = updateData.communicationPreferences.smsEnabled;
        }
        if (updateData.communicationPreferences.reminderPreferences) {
          Object.assign(patient.communicationPreferences.reminderPreferences, updateData.communicationPreferences.reminderPreferences);
        }
      }

      await patient.save();

      // Log the event
      await EventLog.create({
        id: uuidv4(),
        level: 'info',
        category: 'patient',
        action: 'patient_updated',
        userId: doctorId,
        userType: 'doctor',
        resourceId: patientId,
        resourceType: 'patient',
        details: { updatedFields: Object.keys(updateData) }
      });

      return {
        id: patient.id,
        doctorId: patient.doctorId,
        name: patient.name,
        phone: patient.phone,
        email: patient.email,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        address: patient.address,
        emergencyContact: patient.emergencyContact,
        medicalHistory: patient.medicalHistory,
        communicationPreferences: patient.communicationPreferences,
        isActive: patient.isActive,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt
      };
    } catch (error) {
      throw new Error(`Failed to update patient: ${error}`);
    }
  }

  /**
   * Add medical note to patient history
   */
  static async addMedicalNote(
    patientId: string,
    doctorId: string,
    noteData: MedicalNoteData
  ): Promise<PatientProfile> {
    try {
      const patient = await Patient.findOne({ id: patientId, doctorId, isActive: true });
      if (!patient) {
        throw new Error('Patient not found');
      }

      // Add note to medical history
      patient.medicalHistory.push({
        ...noteData
      });

      await patient.save();

      // Log the event
      await EventLog.create({
        id: uuidv4(),
        level: 'info',
        category: 'patient',
        action: 'medical_note_added',
        userId: doctorId,
        userType: 'doctor',
        resourceId: patientId,
        resourceType: 'patient',
        details: { noteType: noteData.type, date: noteData.date }
      });

      return {
        id: patient.id,
        doctorId: patient.doctorId,
        name: patient.name,
        phone: patient.phone,
        email: patient.email,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        address: patient.address,
        emergencyContact: patient.emergencyContact,
        medicalHistory: patient.medicalHistory,
        communicationPreferences: patient.communicationPreferences,
        isActive: patient.isActive,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt
      };
    } catch (error) {
      throw new Error(`Failed to add medical note: ${error}`);
    }
  }

  /**
   * Get patient medical history
   */
  static async getMedicalHistory(
    patientId: string,
    doctorId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    notes: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const patient = await Patient.findOne({ id: patientId, doctorId, isActive: true });
      if (!patient) {
        throw new Error('Patient not found');
      }

      const skip = (page - 1) * limit;
      const notes = patient.medicalHistory
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(skip, skip + limit);

      const total = patient.medicalHistory.length;
      const totalPages = Math.ceil(total / limit);

      return {
        notes,
        total,
        page,
        totalPages
      };
    } catch (error) {
      throw new Error(`Failed to get medical history: ${error}`);
    }
  }

  /**
   * Deactivate patient
   */
  static async deactivatePatient(
    patientId: string,
    doctorId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const patient = await Patient.findOne({ id: patientId, doctorId, isActive: true });
      if (!patient) {
        throw new Error('Patient not found');
      }

      patient.isActive = false;
      await patient.save();

      // Log the event
      await EventLog.create({
        id: uuidv4(),
        level: 'warning',
        category: 'patient',
        action: 'patient_deactivated',
        userId: doctorId,
        userType: 'doctor',
        resourceId: patientId,
        resourceType: 'patient',
        details: {}
      });

      return { success: true, message: 'Patient deactivated successfully' };
    } catch (error) {
      throw new Error(`Failed to deactivate patient: ${error}`);
    }
  }

  /**
   * Reactivate patient
   */
  static async reactivatePatient(
    patientId: string,
    doctorId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const patient = await Patient.findOne({ id: patientId, doctorId, isActive: false });
      if (!patient) {
        throw new Error('Patient not found or already active');
      }

      patient.isActive = true;
      await patient.save();

      // Log the event
      await EventLog.create({
        id: uuidv4(),
        level: 'info',
        category: 'patient',
        action: 'patient_reactivated',
        userId: doctorId,
        userType: 'doctor',
        resourceId: patientId,
        resourceType: 'patient',
        details: {}
      });

      return { success: true, message: 'Patient reactivated successfully' };
    } catch (error) {
      throw new Error(`Failed to reactivate patient: ${error}`);
    }
  }

  /**
   * Get patient statistics
   */
  static async getPatientStatistics(doctorId: string): Promise<{
    totalPatients: number;
    activePatients: number;
    newPatientsThisMonth: number;
    patientsByGender: Record<string, number>;
  }> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [totalPatients, activePatients, newPatientsThisMonth, patientsByGender] = await Promise.all([
        Patient.countDocuments({ doctorId }),
        Patient.countDocuments({ doctorId, isActive: true }),
        Patient.countDocuments({
          doctorId,
          createdAt: { $gte: startOfMonth }
        }),
        Patient.aggregate([
          { $match: { doctorId, isActive: true } },
          { $group: { _id: '$gender', count: { $sum: 1 } } }
        ])
      ]);

      const genderStats: Record<string, number> = {};
      patientsByGender.forEach((item: any) => {
        genderStats[item._id || 'unknown'] = item.count;
      });

      return {
        totalPatients,
        activePatients,
        newPatientsThisMonth,
        patientsByGender: genderStats
      };
    } catch (error) {
      throw new Error(`Failed to get patient statistics: ${error}`);
    }
  }

  /**
   * Find doctor by phone number
   */
  static async findDoctorByPhone(phoneNumber: string): Promise<{
    id: string;
    name: string;
    phone: string;
    email: string;
    specialization: string;
    licenseNumber: string;
  } | null> {
    try {
      // Clean phone number (remove spaces, dashes, plus sign)
      const cleanPhone = phoneNumber.replace(/[\s\-\(\)\+]/g, '');
      
      const doctor = await Doctor.findOne({ 
        phone: { $regex: cleanPhone, $options: 'i' },
        isActive: true 
      });

      if (!doctor) {
        return null;
      }

      return {
        id: doctor.id,
        name: doctor.name,
        phone: doctor.phone,
        email: doctor.email,
        specialization: doctor.specialization,
        licenseNumber: doctor.licenseNumber
      };
    } catch (error) {
      throw new Error(`Failed to find doctor by phone: ${error}`);
    }
  }
}
