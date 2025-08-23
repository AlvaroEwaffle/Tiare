# Product Design Requirement (PDR) – Tiare (MVP v1.0)

## 🎯 Objetivo

Construir un sistema de gestión de agenda y cobranza para psicólogos/psiquiatras, con integración a Google Calendar y un agente de WhatsApp (Tiare) como interfaz principal de comunicación con pacientes. El doctor tendrá una interfaz básica para configurar agenda, pacientes y procesos de cobranza. **Todo el orquestamiento se implementará en el Backend** (sin n8n) usando colas y jobs.

---

## 👥 Usuarios Principales

1. **Doctor (Psicólogo/Psiquiatra)**

   * Configura su cuenta y agenda.
   * Administra pacientes y sus datos básicos.
   * Define políticas de consulta (formato, cancelación, precios).
   * Configura y revisa estados de cobranza.

2. **Paciente**

   * Interactúa vía WhatsApp con Tiare.
   * Agenda, reprograma o cancela citas.
   * Recibe recordatorios de consultas.
   * Recibe boletas y recordatorios de pago.

---

## 🧭 Journey del Doctor

1. **Registro y Onboarding**

   * Se registra en la plataforma (correo y contraseña).
   * Conecta su cuenta de Google Calendar.
   * Define sus horarios disponibles, duración de consultas y tipos de atención (presencial, remota, domicilio).
   * Configura políticas de cancelación y frecuencia de cobranza (diaria, semanal o mensual).

2. **Gestión de Pacientes**

   * Ingresa pacientes manualmente en el Backoffice o comparte un link para que el paciente inicie conversación con Tiare en WhatsApp.
   * Ve historial de pacientes y notas asociadas.

3. **Gestión de Agenda**

   * Visualiza citas en el calendario sincronizado con Google Calendar.
   * Reagenda o cancela citas desde el Backoffice.
   * Revisa disponibilidad generada automáticamente por el sistema.

4. **Cobranza y Boletas**

   * Revisa el estado de pagos de sus pacientes (pendiente, pagado, vencido).
   * Configura recordatorios automáticos de pago.
   * Sube boletas en formato PDF y Tiare las envía a los pacientes.

5. **Monitoreo**

   * Consulta reportes en Backoffice (estado de agenda, cobranzas realizadas, pacientes atendidos).
   * Accede a auditoría de eventos en `events_log`.

---

## 🧭 Journey del Paciente

1. **Primer Contacto**

   * Recibe un link o QR para iniciar conversación con Tiare en WhatsApp.
   * Proporciona datos básicos (nombre, teléfono).

2. **Agendar Cita**

   * Solicita disponibilidad a Tiare.
   * Recibe opciones de horarios libres (calculados desde la configuración del doctor y Google Calendar).
   * Confirma cita y recibe mensaje de confirmación con políticas de cancelación.

3. **Reagendar/Cancelar**

   * Pide a Tiare reagendar o cancelar.
   * Recibe nuevas opciones de horarios o confirmación de cancelación.
   * Si aplica, recibe información sobre penalización por cancelación tardía.

4. **Durante la Consulta**

   * Asiste en formato presencial, remoto o a domicilio, según lo acordado.
   * Puede recibir recordatorios previos (24h y 2h antes).

5. **Pago y Boleta**

   * Recibe recordatorio de pago vía WhatsApp.
   * Realiza transferencia o pago según lo indicado.
   * Recibe boleta en formato PDF enviada automáticamente por Tiare.

6. **Post-Consulta**

   * Recibe agradecimiento o encuesta opcional vía WhatsApp.
   * Puede consultar historial de citas o próximas citas programadas.

---

## 📦 Componentes Técnicos (sin n8n)

* Backend (Node.js con Express o NestJS).
* MongoDB (Mongoose ODM).
* Redis + BullMQ para colas.
* React + Tailwind para Backoffice.
* WhatsApp Cloud API para mensajería.
* Google Calendar API para agenda.

---

## 🛠️ Endpoints a Implementar

*(Se mantienen los listados previos, ver secciones de autenticación, pacientes, citas, cobranza, boletas y WhatsApp.)*

---

## 🔁 Workers y Jobs

* Reminder pre-appointment (24h/2h antes).
* Reminder post-appointment (pago/encuesta).
* Billing cycle (diario/semanal/mensual).
* GCal poll/watch.
* Invoice send.

---

## ✅ Instrucciones para Cursor

(Se mantienen los scaffolds de backend, modelos, WhatsAppService, React backoffice y jobs como definidos en la versión anterior del documento.)
