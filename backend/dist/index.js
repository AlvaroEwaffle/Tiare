"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables FIRST, before any other imports
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
// Import routes
const doctor_routes_1 = __importDefault(require("./routes/doctor.routes"));
const patient_routes_1 = __importDefault(require("./routes/patient.routes"));
const search_routes_1 = __importDefault(require("./routes/search.routes"));
const calendar_routes_1 = __importDefault(require("./routes/calendar.routes"));
const appointment_routes_1 = __importDefault(require("./routes/appointment.routes"));
const whatsapp_routes_1 = __importDefault(require("./routes/whatsapp.routes"));
// Debug: Log environment variables
console.log('🔧 [Environment Check] Loaded environment variables:', {
    MONGODB_URI: !!process.env.MONGODB_URI,
    GOOGLE_CALENDAR_CLIENT_ID: !!process.env.GOOGLE_CALENDAR_CLIENT_ID,
    GOOGLE_CALENDAR_CLIENT_SECRET: !!process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
    GOOGLE_CALENDAR_REDIRECT_URI: !!process.env.GOOGLE_CALENDAR_REDIRECT_URI,
    NODE_ENV: process.env.NODE_ENV
});
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3002;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
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
app.use('/api/doctors', doctor_routes_1.default);
app.use('/api/patients', patient_routes_1.default);
app.use('/api/search', search_routes_1.default);
app.use('/api/doctors/calendar', calendar_routes_1.default);
app.use('/api/appointments', appointment_routes_1.default);
app.use('/api/whatsapp', whatsapp_routes_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
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
mongoose_1.default.connect(MONGODB_URI)
    .then(() => {
    var _a;
    console.log('✅ Connected to MongoDB successfully');
    console.log('🗄️  Database:', ((_a = mongoose_1.default.connection.db) === null || _a === void 0 ? void 0 : _a.databaseName) || 'Unknown');
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
        console.log('💬 WhatsApp webhook:', `${baseUrl}/api/whatsapp/webhook`);
    });
})
    .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
});
exports.default = app;
