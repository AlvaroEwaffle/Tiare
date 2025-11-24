import type { AxiosInstance } from 'axios';
import type { Server } from '@modelcontextprotocol/sdk/server';
import { CreateAppointmentInput, CancelAppointmentInput, DoctorAvailabilityInput } from '../types/appointments';

export function registerAppointmentTools(server: Server, http: AxiosInstance) {
  /**
   * Crea una nueva cita en Tiare usando el backend existente.
   */
  server.tool(
    'tiare_create_appointment',
    {
      description: 'Crea una nueva cita para un paciente existente en Tiare.',
      inputSchema: {
        type: 'object',
        properties: {
          patientId: {
            type: 'string',
            description: 'ID interno del paciente en Tiare.'
          },
          dateTime: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha y hora de la cita en formato ISO 8601.'
          },
          duration: {
            type: 'integer',
            minimum: 15,
            maximum: 480,
            description: 'Duración de la cita en minutos (entre 15 y 480).'
          },
          type: {
            type: 'string',
            enum: ['presential', 'remote', 'home'],
            description: 'Tipo de consulta.'
          },
          notes: {
            type: 'string',
            description: 'Notas opcionales para la cita.',
            nullable: true
          }
        },
        required: ['patientId', 'dateTime', 'duration', 'type'],
        additionalProperties: false
      }
    },
    async (input: CreateAppointmentInput) => {
      const response = await http.post('/api/appointments', {
        patientId: input.patientId,
        dateTime: input.dateTime,
        duration: input.duration,
        type: input.type,
        notes: input.notes
      });

      return response.data;
    }
  );

  /**
   * Cancela una cita existente en Tiare.
   */
  server.tool(
    'tiare_cancel_appointment',
    {
      description: 'Cancela una cita existente en Tiare con un motivo de cancelación.',
      inputSchema: {
        type: 'object',
        properties: {
          appointmentId: {
            type: 'string',
            description: 'ID de la cita a cancelar.'
          },
          reason: {
            type: 'string',
            description: 'Motivo de la cancelación que se registrará en Tiare.'
          }
        },
        required: ['appointmentId', 'reason'],
        additionalProperties: false
      }
    },
    async (input: CancelAppointmentInput) => {
      const response = await http.delete(`/api/appointments/${input.appointmentId}`, {
        data: { reason: input.reason }
      });

      return response.data;
    }
  );

  /**
   * Devuelve los slots de disponibilidad de un doctor en un rango de fechas.
   */
  server.tool(
    'tiare_get_doctor_availability',
    {
      description: 'Obtiene la disponibilidad de un doctor en un rango de fechas usando la lógica híbrida de Tiare.',
      inputSchema: {
        type: 'object',
        properties: {
          doctorId: {
            type: 'string',
            description: 'ID del doctor en Tiare para el que se quiere consultar disponibilidad.'
          },
          startDate: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha de inicio del rango, en formato ISO 8601.'
          },
          endDate: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha de término del rango, en formato ISO 8601.'
          }
        },
        required: ['doctorId', 'startDate', 'endDate'],
        additionalProperties: false
      }
    },
    async (input: DoctorAvailabilityInput) => {
      const response = await http.get(`/api/appointments/availability/${input.doctorId}`, {
        params: {
          startDate: input.startDate,
          endDate: input.endDate
        }
      });

      return response.data;
    }
  );
}


