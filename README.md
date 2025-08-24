# 🏥 Tiare - Healthcare Practice Management System

**Tiare** is a comprehensive healthcare practice management system designed for psychologists and psychiatrists. It provides tools for patient management, appointment scheduling, billing, and WhatsApp integration for patient communication.

## 🚀 Features

### ✅ **Currently Working Features**

- **Doctor Management**: Registration, login, and profile management
- **Patient Management**: Create new patients with WhatsApp integration
- **Dashboard**: Professional dashboard with doctor information display
- **WhatsApp Integration**: Automatic patient communication setup
- **MongoDB Database**: Robust data persistence
- **RESTful API**: Clean, documented endpoints
- **Modern Frontend**: React-based UI with Tailwind CSS

### 🔄 **In Development**

- Appointment scheduling system
- Billing and invoicing
- Google Calendar integration
- Advanced patient management
- Role-based access control

## 🏗️ Architecture

### **Backend Stack**
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens
- **Development**: tsx for hot reloading

### **Frontend Stack**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui + Radix UI
- **State Management**: React Query + React Hook Form
- **Routing**: React Router DOM

## 📡 API Endpoints

### **Health Check**
```http
GET /api/health
```
Returns system status and basic information.

**Response:**
```json
{
  "status": "OK",
  "message": "Tiare Healthcare Practice Management API",
  "timestamp": "2025-08-23T21:17:45.837Z"
}
```

### **Doctor Management**

#### **Register Doctor**
```http
POST /api/doctors/register
```

**Request Body:**
```json
{
  "name": "Dr. Álvaro Villena",
  "email": "alvaro@tiare.com",
  "password": "password123",
  "specialization": "Psicología Clínica",
  "licenseNumber": "PSI-2024-001",
  "phone": "+56920115198",
  "address": "Optional address"
}
```

**Response:**
```json
{
  "message": "Doctor registered successfully",
  "doctor": {
    "id": "1a603974-847e-4b35-be60-4bbb2715e870",
    "name": "Dr. Álvaro Villena",
    "email": "alvaro@tiare.com",
    "specialization": "Psicología Clínica",
    "licenseNumber": "PSI-2024-001",
    "phone": "+56920115198",
    "address": "Optional address"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### **Doctor Login**
```http
POST /api/doctors/login
```

**Request Body:**
```json
{
  "email": "alvaro@tiare.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "doctor": {
    "id": "1a603974-847e-4b35-be60-4bbb2715e870",
    "name": "Dr. Álvaro Villena",
    "email": "alvaro@tiare.com",
    "specialization": "Psicología Clínica",
    "licenseNumber": "PSI-2024-001",
    "phone": "+56920115198"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### **Get Doctor Profile (Protected)**
```http
GET /api/doctors/:id
```
Requires authentication token. Returns complete doctor profile.


#### **Get Doctor Info (Public)**
```http
GET /api/doctors/info/:id
```
Public endpoint for basic doctor information. Perfect for patient communication.

**Response:**
```json
{
  "message": "Doctor info retrieved successfully",
  "doctor": {
    "id": "1a603974-847e-4b35-be60-4bbb2715e870",
    "name": "Dr. Álvaro Villena",
    "phone": "+56920115198",
    "specialization": "Psicología Clínica",
    "licenseNumber": "PSI-2024-001"
  }
}
```

#### **Update Doctor Profile (Protected)**
```http
PUT /api/doctors/:id
```
Requires authentication token. Update doctor information.

### **Patient Management**

#### **Create New Patient**
```http
POST /api/patients/create
```

**Request Body:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "+34612345678",
  "notes": "Nuevo paciente"
}
```

**Response:**
```json
{
  "message": "Patient created successfully",
  "patient": {
    "id": "fda63c2a-c968-4aae-859e-07a5e7d5d17e",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "+34612345678",
    "notes": "Nuevo paciente",
    "createdAt": "2025-08-23T20:39:45.715Z"
  },
  "whatsappLink": "https://wa.me/34612345678?text=Hola%20Juan%20P%C3%A9rez!%20%F0%9F%91%8B%20Soy%20el%20asistente%20virtual%20de%20Tiare.%20%C2%BFEn%20qu%C3%A9%20puedo%20ayudarte%20hoy%3F",
  "whatsappMessage": "Hola Juan Pérez! 👋 Soy el asistente virtual de Tiare. ¿En qué puedo ayudarte hoy?"
}
```

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ 
- MongoDB (local or Atlas)
- npm or yarn

### **Backend Setup**

1. **Clone and navigate to backend:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Environment Configuration:**
Create a `.env` file based on `.env.example`:
```env
# Server Configuration
PORT=3002
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/tiare
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/tiare

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

4. **Start the backend:**
```bash
npm run dev
```

The backend will start on `http://localhost:3002`

### **Frontend Setup**

1. **Navigate to frontend:**
```bash
cd frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the frontend:**
```bash
npm run dev
```

The frontend will start on `http://localhost:8080`

## 📱 WhatsApp Integration

Tiare automatically generates personalized WhatsApp links for each patient:

- **Personalized greeting** with patient's name
- **Pre-filled message** introducing the Tiare virtual assistant
- **Direct link** to open WhatsApp with the conversation ready
- **Copy functionality** for easy sharing via email or other channels

**Example WhatsApp Link:**
```
https://wa.me/34612345678?text=Hola%20Juan%20P%C3%A9rez!%20%F0%9F%91%8B%20Soy%20el%20asistente%20virtual%20de%20Tiare.%20%C2%BFEn%20qu%C3%A9%20puedo%20ayudarte%20hoy%3F
```

## 🎯 Current Use Cases

### **For Doctors:**
1. **Register and login** to the system
2. **View professional dashboard** with contact information
3. **Create new patients** with automatic WhatsApp setup
4. **Copy contact information** for easy sharing
5. **Access patient management** tools

### **For Patients:**
1. **Receive personalized WhatsApp messages** from the virtual assistant
2. **Start conversations** with pre-filled greetings
3. **Access doctor information** through public endpoints

## 🔧 Development

### **Backend Scripts**
```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm run start        # Start production server
```

### **Frontend Scripts**
```bash
npm run dev          # Start Vite development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### **Database Models**

The system includes these MongoDB models:
- **Doctor**: Professional information and credentials
- **Patient**: Patient records and contact information
- **Appointment**: Scheduling and session management
- **Billing**: Financial records and invoicing
- **EventLog**: System activity tracking

## 🌟 Key Features

### **Professional Dashboard**
- Doctor information display
- Contact details with copy functionality
- Quick action buttons
- Professional styling with Tailwind CSS

### **Patient Creation Flow**
- Simple form with required fields
- Automatic WhatsApp link generation
- Success confirmation with patient details
- Easy navigation back to dashboard

### **API Design**
- RESTful endpoints
- Comprehensive error handling
- Detailed logging for debugging
- Public and protected routes as needed

## 🔒 Security Features

- **JWT Authentication** for protected endpoints
- **Password hashing** with bcrypt
- **Input validation** on all endpoints
- **Error handling** without exposing sensitive information
- **CORS configuration** for frontend integration

## 📊 API Status

| Endpoint | Status | Authentication | Description |
|----------|--------|----------------|-------------|
| `GET /api/health` | ✅ Working | None | System health check |
| `POST /api/doctors/register` | ✅ Working | None | Doctor registration |
| `POST /api/doctors/login` | ✅ Working | None | Doctor authentication |
| `GET /api/doctors/:id` | ✅ Working | Required | Full doctor profile |
| `GET /api/doctors/info/:id` | ✅ Working | None | Public doctor info |
| `PUT /api/doctors/:id` | ✅ Working | Required | Update doctor profile |
| `POST /api/patients/create` | ✅ Working | None | Create new patient |

## 🚧 Known Limitations

- Patient creation currently doesn't require doctor association
- Some endpoints return mock data for demonstration
- Authentication middleware needs to be implemented for protected routes
- WhatsApp integration is link-based (no actual API integration yet)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is proprietary software developed for Tiare Healthcare Practice Management.

## 📞 Support

For support or questions about the Tiare system, please contact the development team.

---

**Built with ❤️ for healthcare professionals** 