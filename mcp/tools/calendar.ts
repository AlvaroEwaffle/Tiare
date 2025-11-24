import type { AxiosInstance } from 'axios';
import type { Server } from '@modelcontextprotocol/sdk/server';

export function registerCalendarTools(server: Server, http: AxiosInstance) {
  /**
   * Recupera las citas existentes desde Google Calendar para el doctor autenticado.
   */
  server.tool(
    'tiare_get_calendar_appointments',
    {
      description:
        'Obtiene las citas del Google Calendar del doctor conectado a Tiare en un rango de fechas, usando el backend actual.',
      inputSchema: {
        type: 'object',
        properties: {
          startDate: {
            type: 'string',
            format: 'date-time',
            description:
              'Fecha de inicio del rango en formato ISO 8601. Por defecto, 30 días antes de hoy si no se envía.'
          },
          endDate: {
            type: 'string',
            format: 'date-time',
            description:
              'Fecha de término del rango en formato ISO 8601. Por defecto, 90 días después de hoy si no se envía.'
          }
        },
        required: [],
        additionalProperties: false
      }
    },
    async (input: { startDate?: string; endDate?: string }) => {
      const response = await http.get('/api/doctors/calendar/appointments', {
        params: {
          startDate: input.startDate,
          endDate: input.endDate
        }
      });

      return response.data;
    }
  );

  /**
   * Lanza una sincronización de citas entre Google Calendar y la base de datos local de Tiare.
   */
  server.tool(
    'tiare_sync_calendar_appointments',
    {
      description:
        'Sincroniza las citas de Google Calendar con la base de datos local de Tiare para el doctor autenticado.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: false
      }
    },
    async () => {
      const response = await http.post('/api/doctors/calendar/sync');
      return response.data;
    }
  );
}


