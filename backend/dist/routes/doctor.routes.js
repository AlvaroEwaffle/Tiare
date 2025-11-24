"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_service_1 = require("../services/auth.service");
const doctor_service_1 = require("../services/doctor.service");
const router = (0, express_1.Router)();
// Doctor registration
router.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('🚀 Doctor registration request received');
        console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
        const { name, email, password, specialization, licenseNumber, phone, address } = req.body;
        // Validate required fields
        if (!name || !email || !password || !specialization || !licenseNumber || !phone) {
            console.log('❌ Missing required fields');
            return res.status(400).json({
                error: 'Missing required fields: name, email, password, specialization, licenseNumber, phone'
            });
        }
        console.log('✅ All required fields present, proceeding with registration...');
        console.log('👨‍⚕️ Doctor data:', { name, email, specialization, licenseNumber, phone, address: address || 'Not provided' });
        // Register the doctor
        console.log('🔐 Calling AuthService.registerDoctor...');
        const result = yield auth_service_1.AuthService.registerDoctor({
            name,
            email,
            password,
            specialization,
            licenseNumber,
            phone,
            address
        });
        console.log('✅ Doctor registered successfully:', result.doctor.id);
        console.log('🎫 Tokens generated:', { accessToken: result.tokens.accessToken ? 'Present' : 'Missing', refreshToken: result.tokens.refreshToken ? 'Present' : 'Missing' });
        res.status(201).json({
            message: 'Doctor registered successfully',
            doctor: {
                id: result.doctor.id,
                name: result.doctor.name,
                email: result.doctor.email,
                specialization: result.doctor.specialization,
                licenseNumber: result.doctor.licenseNumber,
                phone: result.doctor.phone,
                address: result.doctor.address
            },
            tokens: result.tokens
        });
    }
    catch (error) {
        console.error('❌ Doctor registration error:', error);
        console.error('🔍 Error details:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : 'No stack trace'
        });
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
}));
// Doctor login
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                error: 'Missing required fields: email, password'
            });
        }
        // Login the doctor
        const result = yield auth_service_1.AuthService.loginDoctor(email, password);
        res.status(200).json({
            message: 'Login successful',
            doctor: {
                id: result.doctor.id,
                name: result.doctor.name,
                email: result.doctor.email,
                specialization: result.doctor.specialization,
                licenseNumber: result.doctor.licenseNumber,
                phone: result.doctor.phone,
                address: result.doctor.address
            },
            tokens: result.tokens
        });
    }
    catch (error) {
        console.error('Doctor login error:', error);
        res.status(401).json({
            error: error instanceof Error ? error.message : 'Invalid credentials'
        });
    }
}));
// Get doctor profile (protected route)
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const doctor = yield doctor_service_1.DoctorService.getDoctorById(id);
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found' });
        }
        res.status(200).json({
            message: 'Doctor profile retrieved successfully',
            doctor
        });
    }
    catch (error) {
        console.error('Get doctor profile error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
}));
// Get doctor info with phone number (public route for patient communication)
router.get('/info/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('📞 Doctor info request received for ID:', req.params.id);
        const { id } = req.params;
        const doctor = yield doctor_service_1.DoctorService.getDoctorById(id);
        if (!doctor) {
            console.log('❌ Doctor not found with ID:', id);
            return res.status(404).json({ error: 'Doctor not found' });
        }
        console.log('✅ Doctor found:', { id: doctor.id, name: doctor.name, phone: doctor.phone });
        // Return only the necessary information for patient communication
        res.status(200).json({
            message: 'Doctor info retrieved successfully',
            doctor: {
                id: doctor.id,
                name: doctor.name,
                phone: doctor.phone,
                specialization: doctor.specialization,
                licenseNumber: doctor.licenseNumber
            }
        });
    }
    catch (error) {
        console.error('❌ Get doctor info error:', error);
        console.error('🔍 Error details:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : 'No stack trace'
        });
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
}));
// Update doctor profile (protected route)
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updateData = req.body;
        const doctor = yield doctor_service_1.DoctorService.updateDoctor(id, updateData);
        res.status(200).json({
            message: 'Doctor profile updated successfully',
            doctor
        });
    }
    catch (error) {
        console.error('Update doctor profile error:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error'
        });
    }
}));
// TEMPORARY DEBUG ENDPOINT - Remove in production
router.get('/debug', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('🔍 [DEBUG] Doctor debug endpoint called');
        // Simple test without models first
        res.json({
            success: true,
            debug: {
                message: 'Debug endpoint working - testing models next',
                timestamp: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('❌ [DEBUG] Error in doctor debug endpoint:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Debug error'
        });
    }
}));
exports.default = router;
