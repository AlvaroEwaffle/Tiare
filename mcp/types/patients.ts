export interface McpPatient {
  id: string;
  doctorId: string;
  name: string;
  phone: string;
  email?: string;
}

export interface CreatePatientInput {
  name: string;
  phone: string;
  email?: string;
  /**
   * Teléfono del doctor en Tiare, usado por el endpoint actual `/api/patients/create`.
   */
  doctorPhone: string;
  /**
   * Notas libres sobre el paciente (se usan en el flujo actual de creación).
   */
  notes?: string;
}


