import type { AxiosInstance } from 'axios';
import type { Server } from '@modelcontextprotocol/sdk/server';
import { CreatePatientInput } from '../types/patients';

export function registerPatientTools(server: Server, http: AxiosInstance) {
  /**
   * Lista los pacientes activos del doctor autenticado en Tiare.
   */
  server.tool(
    'tiare_list_patients',
    {
      description: 'Lista los pacientes activos asociados al doctor autenticado en Tiare.',
      inputSchema: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            minimum: 1,
            default: 1,
            description: 'Página de resultados (paginación backend).'
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20,
            description: 'Cantidad de pacientes por página.'
          }
        },
        required: [],
        additionalProperties: false
      }
    },
    async (input: { page?: number; limit?: number }) => {
      const response = await http.get('/api/patients', {
        params: {
          page: input.page ?? 1,
          limit: input.limit ?? 20
        }
      });

      return response.data;
    }
  );

  /**
   * Crea un paciente mínimo a partir de datos básicos usados hoy en Tiare.
   */
  server.tool(
    'tiare_create_patient',
    {
      description: 'Crea un nuevo paciente en Tiare a partir de nombre, teléfono y doctorPhone.',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Nombre completo del paciente.'
          },
          phone: {
            type: 'string',
            description: 'Teléfono del paciente (se limpiará internamente en Tiare).'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Correo electrónico del paciente.',
            nullable: true
          },
          doctorPhone: {
            type: 'string',
            description: 'Número de teléfono del doctor en Tiare, usado por el endpoint actual para vincular el paciente.'
          },
          notes: {
            type: 'string',
            description: 'Notas opcionales sobre el paciente.',
            nullable: true
          }
        },
        required: ['name', 'phone', 'doctorPhone'],
        additionalProperties: false
      }
    },
    async (input: CreatePatientInput) => {
      const response = await http.post('/api/patients/create', {
        name: input.name,
        phone: input.phone,
        email: input.email,
        doctorPhone: input.doctorPhone,
        notes: input.notes
      });

      return response.data;
    }
  );
}


