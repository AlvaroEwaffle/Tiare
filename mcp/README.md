## Tiare MCP Server

Servidor MCP en Node/TypeScript que expone funcionalidades clave de Tiare (agenda, pacientes y calendario) como **tools** para agentes.

### Arquitectura resumida

- **Proceso independiente**: el servidor MCP corre como un proceso Node separado del backend de Tiare.
- **Comunicación con Tiare**: se conecta al backend vía HTTP REST usando `axios` contra `TIARE_BACKEND_URL`.
- **Autenticación**: usa un JWT de doctor configurado en `TIARE_BACKEND_TOKEN` (MVP single‑doctor por instancia).
- **Tools expuestos (MVP)**:
  - `tiare_create_appointment`: crear cita.
  - `tiare_cancel_appointment`: cancelar cita.
  - `tiare_get_doctor_availability`: leer disponibilidad.
  - `tiare_list_patients`: listar pacientes del doctor.
  - `tiare_create_patient`: crear paciente básico.
  - `tiare_get_calendar_appointments`: leer citas de Google Calendar.
  - `tiare_sync_calendar_appointments`: sincronizar calendario.

### Estructura de carpetas

- `index.ts`: punto de entrada del servidor MCP, registra tools y arranca transporte stdio.
- `tools/`: implementación de cada tool MCP que llama al backend de Tiare.
  - `appointments.ts`
  - `patients.ts`
  - `calendar.ts`
- `types/`: tipos compartidos para inputs/outputs de tools.
  - `common.ts`
  - `appointments.ts`
  - `patients.ts`

### Configuración

Crear un archivo `.env` en `mcp/` (o usar variables de entorno) con:

```bash
TIARE_BACKEND_URL=http://localhost:3002
TIARE_BACKEND_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> El token debe ser un JWT válido emitido por Tiare para un doctor. En el futuro se puede reemplazar por un flujo dinámico de login o tokens por usuario.

### Scripts

Desde la carpeta `mcp/`:

- **Instalar dependencias**

```bash
npm install
```

- **Desarrollo**

```bash
npm run dev
```

- **Build**

```bash
npm run build
```

- **Producción**

```bash
npm start
```


