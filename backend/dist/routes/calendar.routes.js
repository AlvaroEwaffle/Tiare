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
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const googleCalendarOAuth_service_1 = __importDefault(require("../services/googleCalendarOAuth.service"));
const googleCalendar_service_1 = require("../services/googleCalendar.service");
const router = express_1.default.Router();
// Frontend URLs for OAuth callbacks
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';
/**
 * POST /api/doctors/calendar/auth
 * Genera la URL de autorización OAuth 2.0 para Google Calendar
 */
router.post('/auth', auth_middleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // Validate environment variables
        if (!googleCalendarOAuth_service_1.default.validateEnvironment()) {
            return res.status(500).json({
                success: false,
                error: 'Google Calendar OAuth not configured. Please check environment variables.'
            });
        }
        const doctorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!doctorId) {
            return res.status(401).json({
                success: false,
                error: 'User ID not found in token'
            });
        }
        // Generate authorization URL
        const authUrl = googleCalendarOAuth_service_1.default.generateAuthUrl(doctorId);
        console.log(`🔗 Generated OAuth URL for doctor ${doctorId}: ${authUrl}`);
        res.json({
            success: true,
            authUrl: authUrl,
            message: 'Authorization URL generated successfully'
        });
    }
    catch (error) {
        console.error('Error generating OAuth URL:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to generate authorization URL'
        });
    }
}));
/**
 * GET /api/doctors/calendar/callback
 * Callback URL para recibir el código de autorización de Google
 */
router.get('/callback', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { code, state, error } = req.query;
        console.log(`📥 [OAuth Callback] Received callback with:`, {
            hasCode: !!code,
            hasState: !!state,
            hasError: !!error,
            error: error
        });
        // Check for OAuth errors
        if (error) {
            console.error(`❌ [OAuth Callback] OAuth error from Google: ${error}`);
            return res.redirect(`${FRONTEND_URL}/calendar-auth-error?error=${encodeURIComponent(error)}`);
        }
        if (!code || !state) {
            console.error(`❌ [OAuth Callback] Missing code or state parameter:`, {
                code: !!code,
                state: !!state
            });
            return res.redirect(`${FRONTEND_URL}/calendar-auth-error?error=missing_parameters`);
        }
        console.log(`✅ [OAuth Callback] Valid parameters received, proceeding with token exchange`);
        // Exchange code for tokens
        const { doctorId, oauthData } = yield googleCalendarOAuth_service_1.default.exchangeCodeForTokens(code, state);
        console.log(`✅ [OAuth Callback] OAuth tokens obtained for doctor ${doctorId}`);
        console.log(`📋 [OAuth Callback] Token details:`, {
            hasAccessToken: !!oauthData.accessToken,
            hasRefreshToken: !!oauthData.refreshToken,
            expiryDate: oauthData.expiryDate,
            scope: oauthData.scope,
            tokenType: oauthData.tokenType
        });
        // Redirect to frontend success page
        const redirectUrl = `${FRONTEND_URL}/calendar-auth-success?doctorId=${encodeURIComponent(doctorId)}`;
        console.log(`🔄 [OAuth Callback] Redirecting to: ${redirectUrl}`);
        res.redirect(redirectUrl);
    }
    catch (error) {
        console.error(`❌ [OAuth Callback] Error in OAuth callback:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorRedirectUrl = `${FRONTEND_URL}/calendar-auth-error?error=${encodeURIComponent(errorMessage)}`;
        console.log(`🔄 [OAuth Callback] Redirecting to error page: ${errorRedirectUrl}`);
        res.redirect(errorRedirectUrl);
    }
}));
/**
 * GET /api/doctors/calendar/status
 * Verifica el estado de conexión del calendario de Google
 */
router.get('/status', auth_middleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const doctorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!doctorId) {
            return res.status(401).json({
                success: false,
                error: 'User ID not found in token'
            });
        }
        const status = yield googleCalendarOAuth_service_1.default.getCalendarConnectionStatus(doctorId);
        res.json({
            success: true,
            status: status
        });
    }
    catch (error) {
        console.error('Error getting calendar status:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to get calendar status'
        });
    }
}));
/**
 * POST /api/doctors/calendar/disconnect
 * Desconecta el calendario de Google
 */
router.post('/disconnect', auth_middleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const doctorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!doctorId) {
            return res.status(401).json({
                success: false,
                error: 'User ID not found in token'
            });
        }
        yield googleCalendarOAuth_service_1.default.disconnectCalendar(doctorId);
        res.json({
            success: true,
            message: 'Calendar disconnected successfully'
        });
    }
    catch (error) {
        console.error('Error disconnecting calendar:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to disconnect calendar'
        });
    }
}));
/**
 * POST /api/doctors/calendar/refresh
 * Refresca el token de acceso del calendario
 */
router.post('/refresh', auth_middleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const doctorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!doctorId) {
            return res.status(401).json({
                success: false,
                error: 'User ID not found in token'
            });
        }
        const result = yield googleCalendarOAuth_service_1.default.refreshAccessToken(doctorId);
        res.json({
            success: true,
            message: 'Access token refreshed successfully',
            data: result
        });
    }
    catch (error) {
        console.error('Error refreshing access token:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to refresh access token'
        });
    }
}));
/**
 * GET /api/doctors/calendar/appointments
 * Obtiene las citas existentes del calendario de Google
 */
router.get('/appointments', auth_middleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const doctorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!doctorId) {
            return res.status(401).json({
                success: false,
                error: 'User ID not found in token'
            });
        }
        console.log('🔧 [Appointments Endpoint] Environment variables check:', {
            GOOGLE_CALENDAR_CLIENT_ID: !!process.env.GOOGLE_CALENDAR_CLIENT_ID,
            GOOGLE_CALENDAR_CLIENT_SECRET: !!process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
            GOOGLE_CALENDAR_REDIRECT_URI: !!process.env.GOOGLE_CALENDAR_REDIRECT_URI
        });
        const { startDate, endDate } = req.query;
        // Parse date parameters or use defaults
        const timeMin = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const timeMax = endDate ? new Date(endDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
        console.log('🔧 [Appointments Endpoint] About to call getCalendarConnectionStatus');
        // Get doctor's calendar OAuth info
        const doctor = yield googleCalendarOAuth_service_1.default.getCalendarConnectionStatus(doctorId);
        console.log('🔧 [Appointments Endpoint] getCalendarConnectionStatus result:', {
            isConnected: doctor.isConnected,
            hasRefreshToken: !!doctor.refreshToken,
            hasCalendarId: !!doctor.calendarId
        });
        if (!doctor.isConnected || !doctor.refreshToken) {
            return res.status(400).json({
                success: false,
                error: 'Calendar not connected or missing refresh token. Please connect your Google Calendar first.'
            });
        }
        console.log('🔧 [Appointments Endpoint] About to call fetchExistingEvents');
        // Fetch events from Google Calendar
        const events = yield googleCalendar_service_1.GoogleCalendarService.fetchExistingEvents(doctor.refreshToken, doctor.calendarId || 'primary', timeMin, timeMax, doctorId);
        console.log('🔧 [Appointments Endpoint] fetchExistingEvents completed successfully');
        res.json({
            success: true,
            data: {
                events: events,
                totalCount: events.length,
                timeRange: {
                    start: timeMin.toISOString(),
                    end: timeMax.toISOString()
                }
            }
        });
    }
    catch (error) {
        console.error('❌ [Appointments Endpoint] Error fetching calendar appointments:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch calendar appointments'
        });
    }
}));
/**
 * POST /api/doctors/calendar/sync
 * Sincroniza las citas existentes del calendario de Google con la base de datos local
 */
router.post('/sync', auth_middleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const doctorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!doctorId) {
            return res.status(401).json({
                success: false,
                error: 'User ID not found in token'
            });
        }
        console.log(`🔄 Starting calendar sync for doctor ${doctorId}`);
        // Perform the sync
        const syncResult = yield googleCalendar_service_1.GoogleCalendarService.syncExistingAppointments(doctorId);
        res.json({
            success: true,
            message: 'Calendar sync completed successfully',
            data: syncResult
        });
    }
    catch (error) {
        console.error('Error syncing calendar:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to sync calendar'
        });
    }
}));
/**
 * GET /api/doctors/calendar/test
 * Endpoint de prueba para verificar la configuración del calendario
 */
router.get('/test', auth_middleware_1.authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const doctorId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!doctorId) {
            return res.status(401).json({
                success: false,
                error: 'User ID not found in token'
            });
        }
        const status = yield googleCalendarOAuth_service_1.default.getCalendarConnectionStatus(doctorId);
        if (!status.isConnected || !status.refreshToken) {
            return res.status(400).json({
                success: false,
                error: 'Calendar not connected or missing refresh token',
                status: status
            });
        }
        // Try to fetch a small sample of events to test the connection
        try {
            const events = yield googleCalendar_service_1.GoogleCalendarService.fetchExistingEvents(status.refreshToken, status.calendarId || 'primary', new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
            doctorId);
            res.json({
                success: true,
                message: 'Calendar connection test successful',
                data: {
                    status: status,
                    testEvents: events.slice(0, 5), // Return first 5 events as test
                    totalEventsFound: events.length
                }
            });
        }
        catch (fetchError) {
            res.status(500).json({
                success: false,
                error: 'Calendar connection test failed',
                details: fetchError instanceof Error ? fetchError.message : 'Unknown error',
                status: status
            });
        }
    }
    catch (error) {
        console.error('Error testing calendar connection:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to test calendar connection'
        });
    }
}));
exports.default = router;
