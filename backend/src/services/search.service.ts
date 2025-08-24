import { Doctor, Patient } from '../models';

export interface SearchResult {
  type: 'doctor' | 'patient';
  user: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    // Doctor-specific fields
    specialization?: string;
    licenseNumber?: string;
    address?: string;
    // Patient-specific fields
    doctorId?: string;
    dateOfBirth?: Date;
    gender?: string;
    emergencyContact?: any;
    medicalHistory?: any[];
    communicationPreferences?: any;
    isActive?: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}

export class SearchService {
  /**
   * Search user by phone number
   * Returns doctor or patient information if found
   */
  static async searchByPhoneNumber(phoneNumber: string): Promise<SearchResult | null> {
    try {
      // Clean phone number (remove spaces, dashes, parentheses, plus sign)
      const cleanPhone = phoneNumber.replace(/[\s\-\(\)\+]/g, '');
      
      // Search in doctors first
      const doctor = await Doctor.findOne({ 
        phone: { $regex: cleanPhone, $options: 'i' },
        isActive: true 
      });

      if (doctor) {
        return {
          type: 'doctor',
          user: {
            id: doctor.id,
            name: doctor.name,
            phone: doctor.phone,
            email: doctor.email,
            specialization: doctor.specialization,
            licenseNumber: doctor.licenseNumber,
            address: doctor.address,
            isActive: doctor.isActive,
            createdAt: doctor.createdAt,
            updatedAt: doctor.updatedAt
          }
        };
      }

      // Search in patients if not found in doctors
      const patient = await Patient.findOne({ 
        phone: { $regex: cleanPhone, $options: 'i' },
        isActive: true 
      });

      if (patient) {
        return {
          type: 'patient',
          user: {
            id: patient.id,
            name: patient.name,
            phone: patient.phone,
            email: patient.email,
            doctorId: patient.doctorId,
            dateOfBirth: patient.dateOfBirth,
            gender: patient.gender,
            address: patient.address,
            emergencyContact: patient.emergencyContact,
            medicalHistory: patient.medicalHistory,
            communicationPreferences: patient.communicationPreferences,
            isActive: patient.isActive,
            createdAt: patient.createdAt,
            updatedAt: patient.updatedAt
          }
        };
      }

      return null;
    } catch (error) {
      throw new Error(`Failed to search by phone number: ${error}`);
    }
  }

  /**
   * Search multiple users by partial phone number
   * Returns array of matching doctors and patients
   */
  static async searchByPartialPhone(partialPhone: string, limit: number = 10): Promise<SearchResult[]> {
    try {
      const cleanPartialPhone = partialPhone.replace(/[\s\-\(\)\+]/g, '');
      const results: SearchResult[] = [];

      // Search doctors
      const doctors = await Doctor.find({
        phone: { $regex: cleanPartialPhone, $options: 'i' },
        isActive: true
      }).limit(limit);

      for (const doctor of doctors) {
        results.push({
          type: 'doctor',
          user: {
            id: doctor.id,
            name: doctor.name,
            phone: doctor.phone,
            email: doctor.email,
            specialization: doctor.specialization,
            licenseNumber: doctor.licenseNumber,
            address: doctor.address,
            isActive: doctor.isActive,
            createdAt: doctor.createdAt,
            updatedAt: doctor.updatedAt
          }
        });
      }

      // Search patients (remaining limit)
      const remainingLimit = limit - results.length;
      if (remainingLimit > 0) {
        const patients = await Patient.find({
          phone: { $regex: cleanPartialPhone, $options: 'i' },
          isActive: true
        }).limit(remainingLimit);

        for (const patient of patients) {
          results.push({
            type: 'patient',
            user: {
              id: patient.id,
              name: patient.name,
              phone: patient.phone,
              email: patient.email,
              doctorId: patient.doctorId,
              dateOfBirth: patient.dateOfBirth,
              gender: patient.gender,
              address: patient.address,
              emergencyContact: patient.emergencyContact,
              medicalHistory: patient.medicalHistory,
              communicationPreferences: patient.communicationPreferences,
              isActive: patient.isActive,
              createdAt: patient.createdAt,
              updatedAt: patient.updatedAt
            }
          });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to search by partial phone: ${error}`);
    }
  }
}
