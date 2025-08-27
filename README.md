# 🏥 Tiare - Healthcare Practice Management System

**Tiare** is a comprehensive healthcare practice management system designed for psychologists and psychiatrists. It provides a complete solution for patient management, appointment scheduling, billing, and professional practice administration with modern web technologies and external API integrations.

## 🚀 Current Status

**✅ PRODUCTION READY - Phase 6 COMPLETED**

Tiare has successfully completed all planned development phases and is now a fully functional healthcare practice management system deployed on Railway.

## 🎯 Core Features

### ✅ **Fully Implemented & Working**
- **🔐 Authentication System**: JWT + Refresh tokens with bcrypt (30-day duration)
- **👨‍⚕️ Doctor Management**: Registration, login, profile management, and professional dashboard
- **👶 Patient Management**: Create, search, associate with doctors, and comprehensive patient records
- **📅 Appointment System**: Full appointment creation, management, and Google Calendar integration
- **🔍 Search & Discovery**: Find doctors and patients by phone number (exact and partial matches)
- **📱 WhatsApp Integration**: Automatic patient communication setup with personalized links
- **🎨 Modern UI/UX**: Clean, minimalist interface built with React, TypeScript, and Tailwind CSS
- **🗄️ Database**: MongoDB with Mongoose ODM for robust data persistence
- **🔌 External APIs**: Google Calendar sync, WhatsApp integration, MercadoPago payment processing

### 🔄 **In Development & Testing**
- **Advanced Calendar Features**: Working hours configuration, automatic scheduling
- **Billing System**: Complete payment processing and invoice generation
- **Notification System**: Automated reminders and patient communications
- **Performance Optimization**: Caching and query optimization

## 🏗️ Architecture

### **Backend Stack**
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with middleware architecture
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with refresh mechanism
- **Development**: tsx for hot reloading and development
- **External APIs**: Google Calendar, WhatsApp Cloud, MercadoPago

### **Frontend Stack**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with SWC optimization
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: shadcn/ui + Radix UI primitives
- **State Management**: React Query + React Hook Form
- **Routing**: React Router DOM with protected routes
- **Validation**: Zod schemas for form validation

## 📡 API Endpoints

### **Health Check**
```http
GET /api/health
```
Returns system status and version information.

### **Authentication & User Management**

#### **Doctor Registration & Login**
```http
POST /api/doctors/register
POST /api/doctors/login
```

**Request Body:**
```json
{
  "name": "Dr. Álvaro Villena",
  "email": "alvaro@tiare.com",
  "password": "password123",
  "specialization": "Psicología Clínica",
  "licenseNumber": "PSI-2024-001",
  "phone": "+56920115198"
}
```

**Response includes:** Doctor profile and JWT tokens (access + refresh)

#### **Doctor Profile Management**
```http
GET /api/doctors/:id          # Protected - Full profile
GET /api/doctors/info/:id     # Public - Basic info
PUT /api/doctors/:id          # Protected - Update profile
```

### **Patient Management**

#### **Create Patient**
```http
POST /api/patients/create
```

**Request Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "+34612345678",
  "notes": "Nuevo paciente",
  "doctorPhone": "+56920115198"
}
```

**Response includes:** Patient details and personalized WhatsApp link

#### **List Patients**
```http
GET /api/patients
```
Protected endpoint returning all patients for the authenticated doctor.

### **Appointment Management**

#### **Create Appointment**
```http
POST /api/appointments
```

**Request Body:**
```json
{
  "patientId": "9f0ba5ac-b1f9-4203-af0c-2563cb36b56f",
  "dateTime": "2025-08-28T10:00:00.000Z",
  "duration": 60,
  "notes": "Primera consulta de evaluación",
  "type": "remote"
}
```

**Note:** The `doctorId` is automatically obtained from the patient's record.

#### **List Appointments (Protected)**
```http
POST /api/appointments/list
```
Requires JWT authentication. Lists appointments with filters sent in request body. Returns only essential fields: `title`, `patientName`, `dateTime`, `duration`, `type`, `status`.

**Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "doctorId": "doctor_uuid",
  "patientId": "patient_uuid", // optional
  "status": "scheduled", // optional
  "startDate": "2025-08-25T00:00:00.000Z", // optional
  "endDate": "2025-08-31T23:59:59.999Z", // optional
  "page": 1, // optional, default: 1
  "limit": 20 // optional, default: 20
}
```

**Note:** Either `doctorId` OR `patientId` must be provided. If `patientId` is used, `doctorId` is required.

**Legacy Endpoint:** The old `GET /api/appointments` endpoint is still available for backward compatibility but is deprecated. Use `POST /api/appointments/list` for new implementations.

**Data Source Priority:**
1. **Google Calendar (Primary Source)**: Real-time appointment data from connected Google Calendar
2. **Local Database (Fallback)**: If Google Calendar is unavailable, falls back to local database
3. **Automatic Sync**: Local database is kept updated for offline access and backup

**Enhanced Logging:**
The endpoint now provides comprehensive logging for debugging:
- **Route Level**: Query parameters received and validation
- **Service Level**: Doctor lookup results, Google Calendar connection status
- **Fallback Logic**: When and why fallback to local database occurs
- **Error Details**: Specific reasons for failures (doctor not found, no OAuth, etc.)

**Example Requests:**

**Get all appointments for a doctor:**
```bash
curl -X POST "https://tiare-production.up.railway.app/api/appointments/list" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "677b83ad-cc48-4327-ad6a-30f6e727b69"
  }'
```

**Filter by status for a doctor:**
```bash
curl -X POST "https://tiare-production.up.railway.app/api/appointments/list" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "677b83ad-cc48-4327-ad6a-30f6e727b69",
    "status": "confirmed"
  }'
```

**Filter by patient (requires both doctorId and patientId):**
```bash
curl -X POST "https://tiare-production.up.railway.app/api/appointments/list" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "677b83ad-cc48-4327-ad6a-30f6e727b69",
    "patientId": "9f0ba5ac-b1f9-4203-af0c-2563cb36b56f"
  }'
```

**Filter by date range for a doctor:**
```bash
curl -X POST "https://tiare-production.up.railway.app/api/appointments/list" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "677b83ad-cc48-4327-ad6a-30f6e727b69",
    "startDate": "2025-08-25T00:00:00.000Z",
    "endDate": "2025-08-31T23:59:59.999Z"
  }'
```

**Use pagination for a doctor:**
```bash
curl -X POST "https://tiare-production.up.railway.app/api/appointments/list" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "677b83ad-cc48-4327-ad6a-30f6e727b69",
    "page": 1,
    "limit": 10
  }'
```

**Combine multiple filters for a doctor:**
```bash
curl -X POST "https://tiare-production.up.railway.app/api/appointments/list" \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "doctorId": "677b83ad-cc48-4327-ad6a-30f6e727b69",
    "status": "scheduled",
    "patientId": "9f0ba5ac-b1f9-4203-af0c-2563cb36b56f",
    "page": 1,
    "limit": 5
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "appointments": [
      {
        "title": "Consulta con Alvaro Fidelizarte",
        "patientName": "Alvaro Fidelizarte",
        "dateTime": "2025-08-28T10:00:00.000Z",
        "duration": 60,
        "type": "remote",
        "status": "scheduled"
      }
    ],
    "totalCount": 1,
    "page": 1,
    "totalPages": 1
  }
}
```

**Error Response (Missing Parameters):**
```json
{
  "success": false,
  "error": "Either doctorId or patientId must be provided"
}
```

**Error Response (Invalid Patient Filter):**
```json
{
  "success": false,
  "error": "doctorId is required when filtering by patientId"
}
```

**Error Response (Unauthorized):**
```json
{
  "success": false,
  "error": "User ID not found in token"
}
```

**Error Response (Server Error):**
```json
{
  "success": false,
  "error": "Failed to fetch appointments"
}
```

#### **Get Specific Appointment**
```http
GET /api/appointments/:id
```
Returns detailed appointment information including patient and doctor details.

### **Search & Discovery**

#### **Search by Phone Number**
```http
GET /api/search/phone/:phoneNumber          # Exact match
GET /api/search/phone-partial/:partialPhone # Partial match
```

**Returns:** User information (doctor or patient) with type identification.

### **Calendar Integration**

#### **Google Calendar**
```http
GET /api/doctors/calendar/appointments      # Get synchronized appointments
GET /api/doctors/calendar/auth              # Initiate OAuth flow
```

## 🧪 Testing & Development

### **CURL Testing Suite**
The project includes a comprehensive `CURL.sh` script for testing all API endpoints:

```bash
# Make the script executable
chmod +x CURL.sh

# Run all tests (requires valid JWT token)
./CURL.sh
```

**Features:**
- **Authentication Tests**: Doctor registration, login, and token validation
- **Patient Management**: Create and search patients
- **Appointment Management**: Create, list, and filter appointments
- **Search Functionality**: Phone number search (exact and partial)
- **Calendar Integration**: Google Calendar OAuth and sync
- **Error Handling**: Invalid tokens, missing parameters, edge cases

**Example Test Output:**
```bash
🔐 Testing Authentication...
✅ Doctor registered successfully
✅ Login successful
📋 Testing Patient Management...
✅ Patient created successfully
🔍 Testing Search Functionality...
✅ User found successfully
```

## 🚀 Getting Started

### **Production Environment**
- **URL:** https://tiare-production.up.railway.app
- **Health Check:** https://tiare-production.up.railway.app/api/health
- **Status:** ✅ **Production Ready & Fully Functional**

### **Local Development Setup**

#### **Prerequisites**
- Node.js 18+ 
- MongoDB (local or Atlas)
- npm or yarn
- Google Calendar API credentials (for calendar features)

#### **Backend Setup**
```bash
cd backend
npm install
# Create .env file with required environment variables
npm run dev  # Starts on http://localhost:3002
```

#### **Frontend Setup**
```bash
cd frontend
npm install
npm run dev  # Starts on http://localhost:8080
```

#### **Environment Variables**
```env
# Server
PORT=3002
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/tiare

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# External APIs
GOOGLE_CALENDAR_CLIENT_ID=your-client-id
GOOGLE_CALENDAR_CLIENT_SECRET=your-client-secret
GOOGLE_CALENDAR_REDIRECT_URI=http://localhost:8080/calendar-auth-success
WHATSAPP_ACCESS_TOKEN=your-whatsapp-token
MERCADOPAGO_ACCESS_TOKEN=your-mercadopago-token
```

## 🔒 Security & Authentication

- **JWT Authentication** with refresh tokens for protected endpoints
- **Password hashing** with bcrypt and configurable salt rounds
- **Input validation** and sanitization on all endpoints
- **Error handling** without exposing sensitive information
- **CORS configuration** for secure frontend integration

### **Getting JWT Tokens for Protected Endpoints**

1. **Register a doctor** (if not already registered):
```bash
curl -X POST https://tiare-production.up.railway.app/api/doctors/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Dr. Álvaro Villena", "email": "alvaro@tiare.com", "password": "password123", "specialization": "Psicología Clínica", "licenseNumber": "PSI-2024-001", "phone": "+56920115198"}'
```

2. **Login to get tokens**:
```bash
curl -X POST https://tiare-production.up.railway.app/api/doctors/login \
  -H "Content-Type: application/json" \
  -d '{"email": "alvaro@tiare.com", "password": "password123"}'
```

3. **Use the access token** in protected requests:
```bash
curl -X GET "https://tiare-production.up.railway.app/api/search/phone/+56920115198" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

## 📊 API Status

| Endpoint | Status | Auth | Description |
|----------|--------|------|-------------|
| `GET /api/health` | ✅ Working | None | System health check |
| `POST /api/doctors/register` | ✅ Working | None | Doctor registration |
| `POST /api/doctors/login` | ✅ Working | None | Doctor authentication |
| `GET /api/doctors/:id` | ✅ Working | Required | Full doctor profile |
| `GET /api/doctors/info/:id` | ✅ Working | None | Public doctor info |
| `PUT /api/doctors/:id` | ✅ Working | Required | Update doctor profile |
| `POST /api/patients/create` | ✅ Working | None | Create new patient |
| `GET /api/patients` | ✅ Working | Required | List patients |
| `POST /api/appointments` | ✅ Working | Required | Create appointment |
| `POST /api/appointments/list` | ✅ Working | Required | List appointments with filtering & pagination (essential fields only) |
| `GET /api/appointments/:id` | ✅ Working | Required | Get specific appointment details |
| `GET /api/search/phone/:phoneNumber` | ✅ Working | Required | Search by exact phone |
| `GET /api/search/phone-partial/:partialPhone` | ✅ Working | Required | Search by partial phone |
| `GET /api/doctors/calendar/appointments` | ✅ Working | Required | Calendar appointments |
| `GET /api/doctors/calendar/auth` | ✅ Working | Required | Calendar OAuth |

## 🚧 Roadmap

### **Next Phase (Phase 7)**
- **Complete Billing System**: Payment processing, invoicing, subscription management
- **Advanced Notifications**: Automated reminders, patient communications
- **Performance Optimization**: Caching, query optimization, monitoring
- **Mobile Application**: React Native app for doctors and patients

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software developed for Tiare Healthcare Practice Management.

---

**Built with ❤️ for healthcare professionals**

**Current Status: 85% COMPLETED - PRODUCTION READY** 🚀 