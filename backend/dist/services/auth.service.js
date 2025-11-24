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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const models_1 = require("../models");
const models_2 = require("../models");
class AuthService {
    /**
     * Hash a password using bcrypt
     */
    static hashPassword(password) {
        return __awaiter(this, void 0, void 0, function* () {
            return bcrypt_1.default.hash(password, this.BCRYPT_ROUNDS);
        });
    }
    /**
     * Compare a password with a hash
     */
    static comparePassword(password, hash) {
        return __awaiter(this, void 0, void 0, function* () {
            return bcrypt_1.default.compare(password, hash);
        });
    }
    /**
     * Generate JWT tokens for a user
     */
    static generateTokens(payload) {
        const accessToken = jsonwebtoken_1.default.sign(payload, this.JWT_SECRET, {
            expiresIn: this.ACCESS_TOKEN_EXPIRES_IN
        });
        const refreshToken = jsonwebtoken_1.default.sign(payload, this.JWT_REFRESH_SECRET, {
            expiresIn: this.REFRESH_TOKEN_EXPIRES_IN
        });
        return { accessToken, refreshToken };
    }
    /**
     * Verify and decode a JWT token
     */
    static verifyToken(token, isRefreshToken = false) {
        try {
            const secret = isRefreshToken ? this.JWT_REFRESH_SECRET : this.JWT_SECRET;
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            return decoded;
        }
        catch (error) {
            throw new Error('Invalid or expired token');
        }
    }
    /**
     * Refresh an access token using a refresh token
     */
    static refreshAccessToken(refreshToken) {
        try {
            const payload = this.verifyToken(refreshToken, true);
            return jsonwebtoken_1.default.sign(payload, this.JWT_SECRET, {
                expiresIn: this.ACCESS_TOKEN_EXPIRES_IN
            });
        }
        catch (error) {
            throw new Error('Invalid refresh token');
        }
    }
    /**
     * Register a new doctor
     */
    static registerDoctor(doctorData) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if doctor already exists
            const existingDoctor = yield models_1.Doctor.findOne({
                $or: [{ email: doctorData.email }, { licenseNumber: doctorData.licenseNumber }]
            });
            if (existingDoctor) {
                throw new Error('Doctor with this email or license number already exists');
            }
            // Hash password
            const hashedPassword = yield this.hashPassword(doctorData.password);
            // Create doctor
            const doctor = new models_1.Doctor(Object.assign(Object.assign({ id: (0, uuid_1.v4)() }, doctorData), { password: hashedPassword }));
            yield doctor.save();
            // Generate tokens
            const payload = {
                userId: doctor.id,
                userType: 'doctor',
                email: doctor.email,
                specialization: doctor.specialization
            };
            const tokens = this.generateTokens(payload);
            // Log the event
            yield models_2.EventLog.create({
                id: (0, uuid_1.v4)(),
                level: 'info',
                category: 'authentication',
                action: 'doctor_registered',
                userId: doctor.id,
                userType: 'doctor',
                resourceId: doctor.id,
                resourceType: 'doctor',
                details: { email: doctor.email, specialization: doctor.specialization }
            });
            return { doctor, tokens };
        });
    }
    /**
     * Login a doctor
     */
    static loginDoctor(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            // Find doctor by email
            const doctor = yield models_1.Doctor.findOne({ email, isActive: true });
            if (!doctor) {
                throw new Error('Invalid credentials');
            }
            // Verify password
            const isValidPassword = yield this.comparePassword(password, doctor.password);
            if (!isValidPassword) {
                throw new Error('Invalid credentials');
            }
            // Generate tokens
            const payload = {
                userId: doctor.id,
                userType: 'doctor',
                email: doctor.email,
                specialization: doctor.specialization
            };
            const tokens = this.generateTokens(payload);
            // Log the event
            yield models_2.EventLog.create({
                id: (0, uuid_1.v4)(),
                level: 'info',
                category: 'authentication',
                action: 'doctor_logged_in',
                userId: doctor.id,
                userType: 'doctor',
                resourceId: doctor.id,
                resourceType: 'doctor',
                details: { email: doctor.email }
            });
            return { doctor, tokens };
        });
    }
    /**
     * Extract token from request headers
     */
    static extractTokenFromRequest(req) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        return null;
    }
    /**
     * Validate user permissions
     */
    static validateUserPermissions(userId, resourceId, resourceType) {
        // For now, doctors can only access their own resources
        // This can be expanded for admin roles later
        return userId === resourceId || resourceType === 'doctor';
    }
}
exports.AuthService = AuthService;
AuthService.JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
AuthService.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
AuthService.ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';
AuthService.REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
AuthService.BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');
