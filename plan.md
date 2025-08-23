# Migration Plan: Ewaffle → Tiare

## 🎯 **Migration Overview**

Transform the existing e-learning course generator (Ewaffle) into Tiare, a comprehensive healthcare practice management system with WhatsApp integration.

## 📊 **Current State Analysis**

### **What We Can Reuse**
- ✅ **Frontend Foundation**: React + TypeScript + Vite setup
- ✅ **Backend Foundation**: Node.js + Express + TypeScript
- ✅ **Database**: MongoDB + Mongoose ODM
- ✅ **UI Components**: shadcn/ui + Tailwind CSS
- ✅ **Payment Processing**: MercadoPago integration (can be adapted)
- ✅ **Authentication**: Session-based system (can be enhanced)
- ✅ **Project Structure**: Well-organized MVC architecture

### **What Needs Complete Replacement**
- ❌ **Business Logic**: Course generation → Practice management
- ❌ **Data Models**: Session/Proposal → Doctor/Patient/Appointment
- ❌ **AI Integration**: OpenAI course generation → Healthcare workflows
- ❌ **Payment Flow**: Course purchase → Consultation billing
- ❌ **User Interface**: Course creation → Practice dashboard

## 🚀 **Migration Strategy**

### **Phase 1: Foundation & Infrastructure (Week 1-2)** ✅ **COMPLETED**
1. **Database Schema Migration** ✅ **COMPLETED**
   - ✅ Create new models: Doctor, Patient, Appointment, Billing, EventLog
   - ✅ Set up new indexes and relationships
   - ⏳ Migrate existing data structure (pending - will be done in Phase 2)

2. **Authentication System Enhancement** ✅ **COMPLETED**
   - ✅ Implement role-based access (Doctor, Admin)
   - ✅ JWT token system with refresh mechanism
   - ✅ Password hashing with bcrypt
   - ✅ Authentication middleware and guards
   - ✅ Google OAuth for Calendar integration

3. **Environment & Configuration** ✅ **COMPLETED**
   - ✅ Set up new environment variables (.env.example)
   - ✅ Google Calendar API service
   - ✅ WhatsApp Cloud API service

### **Phase 2: Core Backend Services (Week 3-4)** ✅ **COMPLETED**
1. **Doctor Management Service** ✅ **COMPLETED**
   - ✅ CRUD operations for doctor profiles
   - ✅ Specialization and practice settings
   - ✅ Calendar configuration
   - ✅ Working hours management
   - ✅ Consultation types and pricing

2. **Patient Management Service** ✅ **COMPLETED**
   - ✅ Patient registration and profiles
   - ✅ Medical history tracking
   - ✅ Communication preferences
   - ✅ Emergency contact management
   - ✅ Patient search and statistics

3. **Appointment Service** ✅ **COMPLETED**
   - ✅ Google Calendar integration
   - ✅ Availability calculation
   - ✅ Booking and cancellation logic
   - ✅ WhatsApp notifications
   - ✅ Appointment status management

4. **Billing Service** ✅ **COMPLETED**
   - ✅ Invoice generation
   - ✅ Payment tracking
   - ✅ Automated reminders
   - ✅ Billing statistics
   - ✅ Overdue processing

### **Phase 3: Frontend Transformation (Week 5-6)** ✅ **COMPLETED**
1. **Authentication & Onboarding** ✅
   - ✅ Doctor registration/login
   - ✅ Google Calendar connection
   - ✅ Practice setup wizard

2. **Dashboard & Navigation** ✅
   - ✅ Main practice dashboard
   - ✅ Patient management interface
   - ✅ Appointment calendar view

3. **Billing Interface** ✅
   - ✅ Payment status tracking
   - ✅ Invoice management
   - ✅ Financial reporting

### **Phase 4: Integration & Testing (Week 7-8)**
1. **API Integration**
   - Google Calendar sync
   - WhatsApp Cloud API setup
   - Endpoint testing

2. **Workers & Automation**
   - Reminder scheduling
   - Billing cycle automation
   - Calendar synchronization

3. **Testing & QA**
   - End-to-end testing
   - Performance optimization
   - Security validation

## 🏗️ **New Architecture Components**

### **Data Models**
```typescript
// Core entities
interface Doctor {
  id: string;
  name: string;
  email: string;
  specialization: string;
  googleCalendarId: string;
  practiceSettings: PracticeSettings;
  billingPreferences: BillingPreferences;
}

interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  doctorId: string;
  medicalHistory: MedicalNote[];
  communicationPreferences: CommunicationPreferences;
}

interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  dateTime: Date;
  duration: number;
  type: 'presential' | 'remote' | 'home';
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  googleEventId?: string;
}

interface Billing {
  id: string;
  appointmentId: string;
  patientId: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  dueDate: Date;
  invoiceUrl?: string;
  paymentMethod?: string;
}
```

### **API Endpoints Structure**
```typescript
// Doctor management
POST   /api/doctors/register
POST   /api/doctors/login
GET    /api/doctors/profile
PUT    /api/doctors/profile
POST   /api/doctors/connect-calendar

// Patient management
GET    /api/doctors/:doctorId/patients
POST   /api/doctors/:doctorId/patients
PUT    /api/patients/:patientId
GET    /api/patients/:patientId/history

// Appointment management
GET    /api/doctors/:doctorId/appointments
POST   /api/appointments
PUT    /api/appointments/:id
DELETE /api/appointments/:id
GET    /api/doctors/:doctorId/availability

// Billing
GET    /api/doctors/:doctorId/billing
POST   /api/billing/generate-invoice
PUT    /api/billing/:id/status
POST   /api/billing/send-reminder

// WhatsApp integration (for Tiare agent)
GET    /api/appointments/:id/details
POST   /api/appointments/:id/confirm
POST   /api/appointments/:id/cancel
GET    /api/patients/:patientId/appointments
```

### **Frontend Structure**
```
src/
├── pages/
│   ├── auth/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── Onboarding.tsx
│   ├── dashboard/
│   │   ├── Dashboard.tsx
│   │   ├── Patients.tsx
│   │   ├── Appointments.tsx
│   │   └── Billing.tsx
│   └── settings/
│       ├── Profile.tsx
│       ├── Calendar.tsx
│       └── Billing.tsx
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Navigation.tsx
│   ├── appointments/
│   │   ├── Calendar.tsx
│   │   ├── AppointmentForm.tsx
│   │   └── AppointmentCard.tsx
│   ├── patients/
│   │   ├── PatientList.tsx
│   │   ├── PatientForm.tsx
│   │   └── PatientCard.tsx
│   └── billing/
│       ├── InvoiceList.tsx
│       ├── PaymentStatus.tsx
│       └── FinancialReport.tsx
```

## 🔄 **Data Migration Strategy**

### **Existing Data Handling**
1. **Backup Current Data**: Create backup of existing sessions and user data
2. **Data Transformation**: Map existing user data to new doctor/patient structure
3. **Cleanup**: Remove unused AI-generated content and course structures

### **New Data Seeding**
1. **Default Settings**: Create default practice configurations
2. **Sample Data**: Generate sample patients and appointments for testing
3. **Configuration**: Set up default billing cycles and reminder settings

## 🧪 **Testing Strategy**

### **Unit Testing**
- Service layer functions
- Data validation
- Business logic rules

### **Integration Testing**
- API endpoints
- Database operations
- External API integrations

### **End-to-End Testing**
- Complete user workflows
- Payment processing
- Calendar synchronization

## 📈 **Performance Considerations**

### **Database Optimization**
- Index optimization for appointment queries
- Aggregation pipelines for reporting
- Connection pooling

### **Frontend Performance**
- Lazy loading for large datasets
- Virtual scrolling for patient lists
- Optimistic updates for better UX

### **API Performance**
- Caching for calendar data
- Rate limiting for external APIs
- Background job processing

## 🔒 **Security Measures**

### **Authentication & Authorization**
- JWT tokens with refresh mechanism
- Role-based access control
- Session management

### **Data Protection**
- Patient data encryption
- HIPAA compliance considerations
- Secure API communication

### **External Integrations**
- OAuth 2.0 for Google Calendar
- Webhook security for WhatsApp
- API key management

## 📅 **Timeline & Milestones**

| Week | Phase | Deliverables |
|------|-------|--------------|
| 1-2  | Foundation | Database schema, Auth system, Environment setup |
| 3-4  | Backend | Core services, API endpoints, Database models |
| 5-6  | Frontend | UI components, Dashboard, Forms |
| 7-8  | Integration | API testing, Workers, QA, Deployment |

## 🚨 **Risk Mitigation**

### **Technical Risks**
- **Google Calendar API limits**: Implement rate limiting and caching
- **WhatsApp API changes**: Use stable webhook patterns
- **Database migration issues**: Comprehensive testing and rollback plans

### **Business Risks**
- **User adoption**: Provide comprehensive onboarding and training
- **Data migration**: Extensive testing with sample data
- **Performance issues**: Load testing and optimization

## ✅ **Success Criteria**

1. **Functional Requirements**: All PDR features implemented and tested
2. **Performance**: Sub-2 second response times for critical operations
3. **Security**: Pass security audit and compliance checks
4. **User Experience**: Intuitive interface with minimal training required
5. **Integration**: Seamless Google Calendar and WhatsApp connectivity

## 🔄 **Post-Migration Tasks**

1. **User Training**: Create documentation and training materials
2. **Monitoring**: Set up application monitoring and alerting
3. **Backup**: Establish regular backup and recovery procedures
4. **Support**: Create support documentation and escalation procedures
5. **Optimization**: Performance monitoring and continuous improvement
