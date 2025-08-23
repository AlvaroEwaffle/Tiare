import { v4 as uuidv4 } from 'uuid';
import { Appointment, Patient, Doctor, EventLog } from '../models';
import { GoogleCalendarService } from './googleCalendar.service';
import { WhatsAppService } from './whatsapp.service';

export interface CreateAppointmentData {
  doctorId: string;
  patientId: string;
  dateTime: Date;
  duration: number;
  type: 'presential' | 'remote' | 'home';
  notes?: string;
}

export interface UpdateAppointmentData {
  dateTime?: Date;
  duration?: number;
  type?: 'presential' | 'remote' | 'home';
  status?: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  notes?: string;
  consultationDetails?: {
    diagnosis?: string;
    prescription?: string;
    nextAppointment?: Date;
  };
}

export interface AppointmentWithDetails {
  id: string;
  doctorId: string;
  patientId: string;
  dateTime: Date;
  duration: number;
  type: 'presential' | 'remote' | 'home';
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  notes?: string;
  consultationDetails?: any;
  googleEventId?: string;
  reminders: any[];
  cancellationReason?: string;
  cancellationPenalty?: number;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  doctorSpecialization: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AvailabilitySlot {
  start: Date;
  end: Date;
  available: boolean;
}

export class AppointmentService {
  /**
   * Create a new appointment
   */
  static async createAppointment(appointmentData: CreateAppointmentData): Promise<AppointmentWithDetails> {
    try {
      // Verify doctor and patient exist
      const [doctor, patient] = await Promise.all([
        Doctor.findOne({ id: appointmentData.doctorId, isActive: true }),
        Patient.findOne({ id: appointmentData.patientId, doctorId: appointmentData.doctorId, isActive: true })
      ]);

      if (!doctor) {
        throw new Error('Doctor not found');
      }
      if (!patient) {
        throw new Error('Patient not found');
      }

      // Check if the time slot is available
      const isAvailable = await this.checkAvailability(
        appointmentData.doctorId,
        appointmentData.dateTime,
        appointmentData.duration
      );

      if (!isAvailable) {
        throw new Error('Time slot is not available');
      }

      // Create appointment
      const appointment = new Appointment({
        id: uuidv4(),
        ...appointmentData
      });

      await appointment.save();

      // Create Google Calendar event if doctor has calendar connected
      if (doctor.googleRefreshToken && doctor.googleCalendarId) {
        try {
          const event = {
            summary: `Consulta con ${patient.name}`,
            description: `Tipo: ${appointmentData.type}\nNotas: ${appointmentData.notes || 'Sin notas'}`,
            start: {
              dateTime: appointmentData.dateTime.toISOString(),
              timeZone: 'America/Santiago'
            },
            end: {
              dateTime: new Date(appointmentData.dateTime.getTime() + appointmentData.duration * 60000).toISOString(),
              timeZone: 'America/Santiago'
            },
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'popup', minutes: 24 * 60 }, // 24 hours before
                { method: 'popup', minutes: 2 * 60 }   // 2 hours before
              ]
            }
          };

          const { eventId } = await GoogleCalendarService.createEvent(
            doctor.googleRefreshToken,
            doctor.googleCalendarId,
            event,
            doctor.id
          );

          appointment.googleEventId = eventId;
          appointment.googleCalendarId = doctor.googleCalendarId;
          await appointment.save();
        } catch (error) {
          console.error('Failed to create Google Calendar event:', error);
          // Don't fail the appointment creation if calendar sync fails
        }
      }

      // Send confirmation to patient via WhatsApp if enabled
      if (patient.communicationPreferences?.whatsappEnabled) {
        try {
          await WhatsAppService.sendAppointmentConfirmation(
            patient.phone,
            {
              date: appointmentData.dateTime.toLocaleDateString('es-CL'),
              time: appointmentData.dateTime.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' }),
              type: appointmentData.type,
              doctorName: doctor.name,
              notes: appointmentData.notes
            },
            doctor.id
          );
        } catch (error) {
          console.error('Failed to send WhatsApp confirmation:', error);
        }
      }

      // Log the event
      await EventLog.create({
        id: uuidv4(),
        level: 'info',
        category: 'appointment',
        action: 'appointment_created',
        userId: doctor.id,
        userType: 'doctor',
        resourceId: appointment.id,
        resourceType: 'appointment',
        details: { 
          patientName: patient.name,
          dateTime: appointmentData.dateTime,
          type: appointmentData.type
        }
      });

      return await this.getAppointmentWithDetails(appointment.id);
    } catch (error) {
      throw new Error(`Failed to create appointment: ${error}`);
    }
  }

  /**
   * Get appointment with patient and doctor details
   */
  static async getAppointmentWithDetails(appointmentId: string): Promise<AppointmentWithDetails> {
    try {
      const appointment = await Appointment.findById(appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      const [patient, doctor] = await Promise.all([
        Patient.findOne({ id: appointment.patientId }),
        Doctor.findOne({ id: appointment.doctorId })
      ]);

      if (!patient || !doctor) {
        throw new Error('Patient or doctor not found');
      }

      return {
        id: appointment.id,
        doctorId: appointment.doctorId,
        patientId: appointment.patientId,
        dateTime: appointment.dateTime,
        duration: appointment.duration,
        type: appointment.type,
        status: appointment.status,
        notes: appointment.notes,
        consultationDetails: appointment.consultationDetails,
        googleEventId: appointment.googleEventId,
        reminders: appointment.reminders,
        cancellationReason: appointment.cancellationReason,
        cancellationPenalty: appointment.cancellationPenalty,
        patientName: patient.name,
        patientPhone: patient.phone,
        doctorName: doctor.name,
        doctorSpecialization: doctor.specialization,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt
      };
    } catch (error) {
      throw new Error(`Failed to get appointment details: ${error}`);
    }
  }

  /**
   * Get appointments for a doctor
   */
  static async getAppointmentsByDoctor(
    doctorId: string,
    startDate?: Date,
    endDate?: Date,
    status?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    appointments: AppointmentWithDetails[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      const query: any = { doctorId };

      if (startDate && endDate) {
        query.dateTime = { $gte: startDate, $lte: endDate };
      } else if (startDate) {
        query.dateTime = { $gte: startDate };
      } else if (endDate) {
        query.dateTime = { $lte: endDate };
      }

      if (status) {
        query.status = status;
      }

      const [appointments, total] = await Promise.all([
        Appointment.find(query)
          .sort({ dateTime: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Appointment.countDocuments(query)
      ]);

      const totalPages = Math.ceil(total / limit);

      // Get details for each appointment
      const appointmentsWithDetails = await Promise.all(
        appointments.map(appointment => this.getAppointmentWithDetails(appointment.id))
      );

      return {
        appointments: appointmentsWithDetails,
        total,
        page,
        totalPages
      };
    } catch (error) {
      throw new Error(`Failed to get appointments: ${error}`);
    }
  }

  /**
   * Get appointments for a patient
   */
  static async getAppointmentsByPatient(
    patientId: string,
    doctorId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    appointments: AppointmentWithDetails[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const [appointments, total] = await Promise.all([
        Appointment.find({ patientId, doctorId })
          .sort({ dateTime: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Appointment.countDocuments({ patientId, doctorId })
      ]);

      const totalPages = Math.ceil(total / limit);

      // Get details for each appointment
      const appointmentsWithDetails = await Promise.all(
        appointments.map(appointment => this.getAppointmentWithDetails(appointment.id))
      );

      return {
        appointments: appointmentsWithDetails,
        total,
        page,
        totalPages
      };
    } catch (error) {
      throw new Error(`Failed to get patient appointments: ${error}`);
    }
  }

  /**
   * Update appointment
   */
  static async updateAppointment(
    appointmentId: string,
    doctorId: string,
    updateData: UpdateAppointmentData
  ): Promise<AppointmentWithDetails> {
    try {
      const appointment = await Appointment.findOne({ id: appointmentId, doctorId });
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Update fields
      if (updateData.dateTime) appointment.dateTime = updateData.dateTime;
      if (updateData.duration) appointment.duration = updateData.duration;
      if (updateData.type) appointment.type = updateData.type;
      if (updateData.status) appointment.status = updateData.status;
      if (updateData.notes !== undefined) appointment.notes = updateData.notes;

      // Update consultation details
      if (updateData.consultationDetails) {
        if (!appointment.consultationDetails) {
          appointment.consultationDetails = {};
        }
        Object.assign(appointment.consultationDetails, updateData.consultationDetails);
      }

      await appointment.save();

      // Update Google Calendar event if exists
      if (appointment.googleEventId && appointment.googleCalendarId) {
        try {
          const doctor = await Doctor.findOne({ id: doctorId });
          if (doctor?.googleRefreshToken) {
            const event = {
              summary: `Consulta con ${(await Patient.findOne({ id: appointment.patientId }))?.name}`,
              description: `Tipo: ${appointment.type}\nNotas: ${appointment.notes || 'Sin notas'}`,
              start: {
                dateTime: appointment.dateTime.toISOString(),
                timeZone: 'America/Santiago'
              },
              end: {
                dateTime: new Date(appointment.dateTime.getTime() + appointment.duration * 60000).toISOString(),
                timeZone: 'America/Santiago'
              }
            };

            await GoogleCalendarService.updateEvent(
              doctor.googleRefreshToken,
              appointment.googleCalendarId,
              appointment.googleEventId,
              event,
              doctor.id
            );
          }
        } catch (error) {
          console.error('Failed to update Google Calendar event:', error);
        }
      }

      // Log the event
      await EventLog.create({
        id: uuidv4(),
        level: 'info',
        category: 'appointment',
        action: 'appointment_updated',
        userId: doctorId,
        userType: 'doctor',
        resourceId: appointmentId,
        resourceType: 'appointment',
        details: { updatedFields: Object.keys(updateData) }
      });

      return await this.getAppointmentWithDetails(appointmentId);
    } catch (error) {
      throw new Error(`Failed to update appointment: ${error}`);
    }
  }

  /**
   * Cancel appointment
   */
  static async cancelAppointment(
    appointmentId: string,
    doctorId: string,
    reason: string
  ): Promise<AppointmentWithDetails> {
    try {
      const appointment = await Appointment.findOne({ id: appointmentId, doctorId });
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      if (appointment.status === 'cancelled') {
        throw new Error('Appointment is already cancelled');
      }

      // Check cancellation policy
      const doctor = await Doctor.findOne({ id: doctorId });
      if (doctor) {
        const hoursUntilAppointment = (appointment.dateTime.getTime() - Date.now()) / (1000 * 60 * 60);
        const policyHours = doctor.practiceSettings.cancellationPolicy.hoursNotice;
        
        if (hoursUntilAppointment < policyHours) {
          const penaltyPercentage = doctor.practiceSettings.cancellationPolicy.penaltyPercentage;
          appointment.cancellationPenalty = penaltyPercentage;
        }
      }

      appointment.status = 'cancelled';
      appointment.cancellationReason = reason;
      await appointment.save();

      // Cancel Google Calendar event if exists
      if (appointment.googleEventId && appointment.googleCalendarId) {
        try {
          if (doctor?.googleRefreshToken) {
            await GoogleCalendarService.deleteEvent(
              doctor.googleRefreshToken,
              appointment.googleCalendarId,
              appointment.googleEventId,
              doctor.id
            );
          }
        } catch (error) {
          console.error('Failed to delete Google Calendar event:', error);
        }
      }

      // Notify patient via WhatsApp
      const patient = await Patient.findOne({ id: appointment.patientId });
      if (patient?.communicationPreferences?.whatsappEnabled) {
        try {
          await WhatsAppService.sendTextMessage(
            patient.phone,
            `Tu cita del ${appointment.dateTime.toLocaleDateString('es-CL')} a las ${appointment.dateTime.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} ha sido cancelada.\nMotivo: ${reason}`,
            doctor.id
          );
        } catch (error) {
          console.error('Failed to send cancellation notification:', error);
        }
      }

      // Log the event
      await EventLog.create({
        id: uuidv4(),
        level: 'warning',
        category: 'appointment',
        action: 'appointment_cancelled',
        userId: doctorId,
        userType: 'doctor',
        resourceId: appointmentId,
        resourceType: 'appointment',
        details: { reason, penalty: appointment.cancellationPenalty }
      });

      return await this.getAppointmentWithDetails(appointmentId);
    } catch (error) {
      throw new Error(`Failed to cancel appointment: ${error}`);
    }
  }

  /**
   * Check availability for a time slot
   */
  static async checkAvailability(
    doctorId: string,
    dateTime: Date,
    duration: number
  ): Promise<boolean> {
    try {
      const endTime = new Date(dateTime.getTime() + duration * 60000);

      // Check for overlapping appointments
      const overlappingAppointment = await Appointment.findOne({
        doctorId,
        status: { $in: ['scheduled', 'confirmed'] },
        $or: [
          {
            dateTime: { $lt: endTime },
            $expr: {
              $gte: {
                $add: ['$dateTime', { $multiply: ['$duration', 60000] }]
              },
              dateTime
            }
          }
        ]
      });

      return !overlappingAppointment;
    } catch (error) {
      throw new Error(`Failed to check availability: ${error}`);
    }
  }

  /**
   * Get available time slots for a date
   */
  static async getAvailableSlots(
    doctorId: string,
    date: Date,
    duration: number = 60
  ): Promise<AvailabilitySlot[]> {
    try {
      const doctor = await Doctor.findOne({ id: doctorId, isActive: true });
      if (!doctor) {
        throw new Error('Doctor not found');
      }

      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get working hours for the day
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'lowercase' });
      const workingHours = doctor.practiceSettings.workingHours[dayOfWeek];

      if (!workingHours?.available) {
        return [];
      }

      // Parse working hours
      const [startHour, startMinute] = workingHours.start.split(':').map(Number);
      const [endHour, endMinute] = workingHours.end.split(':').map(Number);

      const workStart = new Date(date);
      workStart.setHours(startHour, startMinute, 0, 0);
      const workEnd = new Date(date);
      workEnd.setHours(endHour, endMinute, 0, 0);

      // Get existing appointments for the day
      const existingAppointments = await Appointment.find({
        doctorId,
        dateTime: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ['scheduled', 'confirmed'] }
      }).sort({ dateTime: 1 });

      // Generate available slots
      const slots: AvailabilitySlot[] = [];
      let currentTime = new Date(workStart);

      while (currentTime < workEnd) {
        const slotEnd = new Date(currentTime.getTime() + duration * 60000);
        
        if (slotEnd <= workEnd) {
          // Check if this slot conflicts with existing appointments
          const isAvailable = !existingAppointments.some(appointment => {
            const appointmentEnd = new Date(appointment.dateTime.getTime() + appointment.duration * 60000);
            return (
              (currentTime < appointmentEnd && slotEnd > appointment.dateTime)
            );
          });

          slots.push({
            start: new Date(currentTime),
            end: slotEnd,
            available: isAvailable
          });
        }

        currentTime = new Date(currentTime.getTime() + 30 * 60000); // 30-minute intervals
      }

      return slots;
    } catch (error) {
      throw new Error(`Failed to get available slots: ${error}`);
    }
  }

  /**
   * Complete appointment
   */
  static async completeAppointment(
    appointmentId: string,
    doctorId: string,
    consultationDetails: {
      diagnosis?: string;
      prescription?: string;
      nextAppointment?: Date;
      notes?: string;
    }
  ): Promise<AppointmentWithDetails> {
    try {
      const appointment = await Appointment.findOne({ id: appointmentId, doctorId });
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      if (appointment.status !== 'confirmed') {
        throw new Error('Appointment must be confirmed to complete');
      }

      appointment.status = 'completed';
      appointment.consultationDetails = {
        type: appointment.type,
        duration: appointment.duration,
        price: 0, // This should come from doctor's consultation types
        ...consultationDetails
      };

      await appointment.save();

      // Log the event
      await EventLog.create({
        id: uuidv4(),
        level: 'info',
        category: 'appointment',
        action: 'appointment_completed',
        userId: doctorId,
        userType: 'doctor',
        resourceId: appointmentId,
        resourceType: 'appointment',
        details: { diagnosis: consultationDetails.diagnosis }
      });

      return await this.getAppointmentWithDetails(appointmentId);
    } catch (error) {
      throw new Error(`Failed to complete appointment: ${error}`);
    }
  }
}
