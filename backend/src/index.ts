import dotenv from 'dotenv';

// Load environment variables FIRST, before any other imports
dotenv.config();

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

// Import routes
import doctorRoutes from './routes/doctor.routes';
import patientRoutes from './routes/patient.routes';
import searchRoutes from './routes/search.routes';
import calendarRoutes from './routes/calendar.routes';
import appointmentRoutes from './routes/appointment.routes';

// Debug: Log environment variables
console.log('🔧 [Environment Check] Loaded environment variables:', {
  MONGODB_URI: !!process.env.MONGODB_URI,
  GOOGLE_CALENDAR_CLIENT_ID: !!process.env.GOOGLE_CALENDAR_CLIENT_ID,
  GOOGLE_CALENDAR_CLIENT_SECRET: !!process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
  GOOGLE_CALENDAR_REDIRECT_URI: !!process.env.GOOGLE_CALENDAR_REDIRECT_URI,
  NODE_ENV: process.env.NODE_ENV
});

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Tiare Healthcare API',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/doctors', doctorRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/doctors/calendar', calendarRoutes);
app.use('/api/appointments', appointmentRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 middleware
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in environment variables');
  process.exit(1);
}

console.log('🔌 Connecting to MongoDB...');
console.log('📊 MongoDB URI:', MONGODB_URI);

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB successfully');
    console.log('🗄️  Database:', mongoose.connection.db?.databaseName || 'Unknown');
    
    // Start server
    app.listen(PORT, () => {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://tiare-production.up.railway.app' 
        : `http://localhost:${PORT}`;
      
      console.log('🏥 Tiare Healthcare API running on port', PORT);
      console.log('📊 Health check:', `${baseUrl}/api/health`);
      console.log('👨‍⚕️ Doctor routes:', `${baseUrl}/api/doctors`);
      console.log('👶 Patient routes:', `${baseUrl}/api/patients`);
      console.log('🔍 Search routes:', `${baseUrl}/api/search`);
      console.log('📅 Calendar routes:', `${baseUrl}/api/doctors/calendar`);
      console.log('📅 Appointment routes:', `${baseUrl}/api/appointments`);
      console.log('📞 Doctor info endpoint:', `${baseUrl}/api/doctors/info/:id`);
    });
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

export default app;
