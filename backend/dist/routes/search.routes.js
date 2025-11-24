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
const search_service_1 = require("../services/search.service");
const auth_service_1 = require("../services/auth.service");
const router = (0, express_1.Router)();
// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        if (!token) {
            console.log('❌ No token provided');
            return res.status(401).json({ error: 'Access token required' });
        }
        const decoded = auth_service_1.AuthService.verifyToken(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        console.log('❌ Invalid token:', error);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};
// Search user by exact phone number
router.get('/phone/:phoneNumber', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        console.log('🔍 Phone search request received');
        console.log('📱 Phone number:', req.params.phoneNumber);
        console.log('👤 Requested by:', ((_a = req.user) === null || _a === void 0 ? void 0 : _a.email) || 'Unknown');
        const { phoneNumber } = req.params;
        if (!phoneNumber || phoneNumber.trim().length === 0) {
            console.log('❌ Empty phone number provided');
            return res.status(400).json({
                error: 'Phone number is required'
            });
        }
        console.log('🔍 Searching for user with phone:', phoneNumber);
        const result = yield search_service_1.SearchService.searchByPhoneNumber(phoneNumber);
        if (!result) {
            console.log('❌ No user found with phone:', phoneNumber);
            return res.status(404).json({
                error: 'No user found with this phone number',
                phoneNumber: phoneNumber
            });
        }
        console.log('✅ User found:', { type: result.type, name: result.user.name, id: result.user.id });
        res.status(200).json({
            message: 'User found successfully',
            result: {
                type: result.type,
                user: result.user
            }
        });
    }
    catch (error) {
        console.error('❌ Phone search error:', error);
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
// Search users by partial phone number
router.get('/phone-partial/:partialPhone', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        console.log('🔍 Partial phone search request received');
        console.log('📱 Partial phone:', req.params.partialPhone);
        console.log('👤 Requested by:', ((_a = req.user) === null || _a === void 0 ? void 0 : _a.email) || 'Unknown');
        const { partialPhone } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        if (!partialPhone || partialPhone.trim().length < 3) {
            console.log('❌ Partial phone too short:', partialPhone);
            return res.status(400).json({
                error: 'Partial phone number must be at least 3 characters'
            });
        }
        console.log('🔍 Searching for users with partial phone:', partialPhone);
        const results = yield search_service_1.SearchService.searchByPartialPhone(partialPhone, limit);
        console.log('✅ Found', results.length, 'users matching partial phone');
        res.status(200).json({
            message: `Found ${results.length} users`,
            results: results,
            searchTerm: partialPhone,
            limit: limit
        });
    }
    catch (error) {
        console.error('❌ Partial phone search error:', error);
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
exports.default = router;
