export interface McpAppointment {
  id: string;
  doctorId: string;
  patientId: string;
  dateTime: string; // ISO 8601
  duration: number;
  type: 'presential' | 'remote' | 'home';
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  title?: string;
  notes?: string;
}

export interface CreateAppointmentInput {
  patientId: string;
  /**
   * Fecha y hora en ISO 8601. Idealmente en la zona horaria del doctor.
   */
  dateTime: string;
  duration: number;
  type: 'presential' | 'remote' | 'home';
  notes?: string;
}

export interface CancelAppointmentInput {
  appointmentId: string;
  reason: string;
}

export interface DoctorAvailabilityInput {
  doctorId: string;
  /**
   * Rango de fechas (inclusive) en ISO 8601 (solo fecha o fecha‑hora).
   */
  startDate: string;
  endDate: string;
}


