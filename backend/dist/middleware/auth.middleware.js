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
exports.handleAuthError = exports.validateResourceOwnership = exports.logRequest = exports.requireAdmin = exports.requireDoctor = exports.requireUserType = exports.authenticateToken = void 0;
const auth_service_1 = require("../services/auth.service");
const models_1 = require("../models");
const uuid_1 = require("uuid");
/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = auth_service_1.AuthService.extractTokenFromRequest(req);
        if (!token) {
            return res.status(401).json({
                error: 'Access token required',
                code: 'TOKEN_MISSING'
            });
        }
        try {
            const payload = auth_service_1.AuthService.verifyToken(token);
            req.user = payload;
            next();
        }
        catch (error) {
            return res.status(401).json({
                error: 'Invalid or expired token',
                code: 'TOKEN_INVALID'
            });
        }
    }
    catch (error) {
        return res.status(500).json({
            error: 'Authentication error',
            code: 'AUTH_ERROR'
        });
    }
});
exports.authenticateToken = authenticateToken;
/**
 * Middleware to require specific user types
 */
const requireUserType = (allowedTypes) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }
        if (!allowedTypes.includes(req.user.userType)) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }
        next();
    };
};
exports.requireUserType = requireUserType;
/**
 * Middleware to require doctor role
 */
exports.requireDoctor = (0, exports.requireUserType)(['doctor', 'admin']);
/**
 * Middleware to require admin role
 */
exports.requireAdmin = (0, exports.requireUserType)(['admin']);
/**
 * Middleware to log requests for audit purposes
 */
const logRequest = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // Capture IP address and user agent
    req.ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    req.userAgent = req.get('User-Agent') || 'unknown';
    // Log the request
    try {
        yield models_1.EventLog.create({
            id: (0, uuid_1.v4)(),
            level: 'info',
            category: 'system',
            action: `${req.method}_${req.path}`,
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId,
            userType: (_b = req.user) === null || _b === void 0 ? void 0 : _b.userType,
            ipAddress: req.ipAddress,
            userAgent: req.userAgent,
            details: {
                method: req.method,
                path: req.path,
                query: req.query,
                body: req.method !== 'GET' ? req.body : undefined
            }
        });
    }
    catch (error) {
        // Don't fail the request if logging fails
        console.error('Failed to log request:', error);
    }
    next();
});
exports.logRequest = logRequest;
/**
 * Middleware to validate resource ownership
 */
const validateResourceOwnership = (resourceType) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                code: 'AUTH_REQUIRED'
            });
        }
        const resourceId = req.params.id || req.params.doctorId;
        if (!resourceId) {
            return res.status(400).json({
                error: 'Resource ID required',
                code: 'RESOURCE_ID_MISSING'
            });
        }
        // For now, doctors can only access their own resources
        // This can be expanded for admin roles later
        if (req.user.userType === 'doctor' && req.user.userId !== resourceId) {
            return res.status(403).json({
                error: 'Access denied to this resource',
                code: 'ACCESS_DENIED'
            });
        }
        next();
    });
};
exports.validateResourceOwnership = validateResourceOwnership;
/**
 * Middleware to handle authentication errors
 */
const handleAuthError = (error, req, res, next) => {
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Invalid token',
            code: 'TOKEN_INVALID'
        });
    }
    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token expired',
            code: 'TOKEN_EXPIRED'
        });
    }
    next(error);
};
exports.handleAuthError = handleAuthError;
