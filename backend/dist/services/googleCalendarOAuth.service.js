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
exports.GoogleCalendarOAuthService = void 0;
const googleapis_1 = require("googleapis");
const doctor_model_1 = require("../models/doctor.model");
class GoogleCalendarOAuthService {
    /**
     * Genera la URL de autorización OAuth 2.0 para Google Calendar
     */
    static generateAuthUrl(doctorId) {
        const oauth2Client = new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CALENDAR_CLIENT_ID, process.env.GOOGLE_CALENDAR_CLIENT_SECRET, this.REDIRECT_URI);
        const state = Buffer.from(JSON.stringify({ doctorId })).toString('base64');
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: this.SCOPES,
            state: state,
            prompt: 'consent' // Force consent to get refresh token
        });
        return authUrl;
    }
    /**
     * Intercambia el código de autorización por tokens de acceso
     */
    static exchangeCodeForTokens(code, state) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Decode state to get doctorId
                const decodedState = JSON.parse(Buffer.from(state, 'base64').toString());
                const { doctorId } = decodedState;
                if (!doctorId) {
                    throw new Error('Invalid state parameter: doctorId not found');
                }
                const oauth2Client = new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CALENDAR_CLIENT_ID, process.env.GOOGLE_CALENDAR_CLIENT_SECRET, this.REDIRECT_URI);
                // Exchange code for tokens
                const { tokens } = yield oauth2Client.getToken(code);
                if (!tokens.access_token || !tokens.refresh_token) {
                    throw new Error('Failed to obtain access token or refresh token');
                }
                const oauthData = {
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token,
                    expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600000), // 1 hour default
                    scope: tokens.scope || this.SCOPES.join(' '),
                    tokenType: tokens.token_type || 'Bearer'
                };
                // Save tokens to database
                yield this.saveOAuthTokens(doctorId, oauthData);
                return { doctorId, oauthData };
            }
            catch (error) {
                console.error('Error exchanging code for tokens:', error);
                throw new Error(`Failed to exchange authorization code: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    /**
     * Guarda los tokens OAuth en la base de datos
     */
    static saveOAuthTokens(doctorId, oauthData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            try {
                console.log(`💾 [SaveOAuthTokens] Starting to save OAuth tokens for doctor: ${doctorId}`);
                console.log(`📋 [SaveOAuthTokens] OAuth data to save:`, {
                    hasAccessToken: !!oauthData.accessToken,
                    hasRefreshToken: !!oauthData.refreshToken,
                    expiryDate: oauthData.expiryDate,
                    scope: oauthData.scope,
                    tokenType: oauthData.tokenType
                });
                const updateData = {
                    'calendar.oauth.accessToken': oauthData.accessToken,
                    'calendar.oauth.refreshToken': oauthData.refreshToken,
                    'calendar.oauth.expiryDate': oauthData.expiryDate,
                    'calendar.oauth.scope': oauthData.scope,
                    'calendar.oauth.tokenType': oauthData.tokenType,
                    'calendar.oauth.isActive': true,
                    'calendar.oauth.calendarId': 'primary',
                    'calendar.oauth.calendarName': 'Primary Calendar',
                    'calendar.lastSync': new Date(),
                    'calendar.nextSync': new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
                };
                console.log(`📝 [SaveOAuthTokens] Update data prepared:`, updateData);
                const result = yield doctor_model_1.Doctor.findOneAndUpdate({ id: doctorId }, { $set: updateData }, { new: true, upsert: false });
                if (!result) {
                    console.error(`❌ [SaveOAuthTokens] Doctor not found with ID: ${doctorId}`);
                    throw new Error(`Doctor not found with ID: ${doctorId}`);
                }
                console.log(`✅ [SaveOAuthTokens] OAuth tokens saved successfully for doctor: ${doctorId}`);
                console.log(`📊 [SaveOAuthTokens] Updated doctor data:`, {
                    id: result.id,
                    name: result.name,
                    email: result.email,
                    hasCalendar: !!result.calendar,
                    hasOAuth: !!((_a = result.calendar) === null || _a === void 0 ? void 0 : _a.oauth),
                    oauthData: ((_b = result.calendar) === null || _b === void 0 ? void 0 : _b.oauth) ? {
                        hasAccessToken: !!result.calendar.oauth.accessToken,
                        hasRefreshToken: !!result.calendar.oauth.refreshToken,
                        isActive: result.calendar.oauth.isActive,
                        calendarId: result.calendar.oauth.calendarId,
                        calendarName: result.calendar.oauth.calendarName
                    } : 'No OAuth data'
                });
                // Verify the data was actually saved by reading it back
                const verificationResult = yield doctor_model_1.Doctor.findOne({ id: doctorId });
                if (verificationResult) {
                    console.log(`🔍 [SaveOAuthTokens] Verification - Doctor data after save:`, {
                        id: verificationResult.id,
                        hasCalendar: !!verificationResult.calendar,
                        hasOAuth: !!((_c = verificationResult.calendar) === null || _c === void 0 ? void 0 : _c.oauth),
                        calendarRaw: verificationResult.calendar,
                        oauthRaw: (_d = verificationResult.calendar) === null || _d === void 0 ? void 0 : _d.oauth,
                        oauthData: ((_e = verificationResult.calendar) === null || _e === void 0 ? void 0 : _e.oauth) ? {
                            hasAccessToken: !!verificationResult.calendar.oauth.accessToken,
                            hasRefreshToken: !!verificationResult.calendar.oauth.refreshToken,
                            isActive: verificationResult.calendar.oauth.isActive,
                            calendarId: verificationResult.calendar.oauth.calendarId,
                            calendarName: verificationResult.calendar.oauth.calendarName
                        } : 'No OAuth data'
                    });
                    // Try to access the data using different methods
                    console.log(`🔍 [SaveOAuthTokens] Raw calendar object:`, JSON.stringify(verificationResult.calendar, null, 2));
                    console.log(`🔍 [SaveOAuthTokens] Raw oauth object:`, JSON.stringify((_f = verificationResult.calendar) === null || _f === void 0 ? void 0 : _f.oauth, null, 2));
                    // Check if the data exists using toObject()
                    const doctorObject = verificationResult.toObject();
                    console.log(`🔍 [SaveOAuthTokens] Doctor as plain object:`, {
                        hasCalendar: !!doctorObject.calendar,
                        hasOAuth: !!((_g = doctorObject.calendar) === null || _g === void 0 ? void 0 : _g.oauth),
                        calendarKeys: doctorObject.calendar ? Object.keys(doctorObject.calendar) : 'No calendar',
                        oauthKeys: ((_h = doctorObject.calendar) === null || _h === void 0 ? void 0 : _h.oauth) ? Object.keys(doctorObject.calendar.oauth) : 'No oauth'
                    });
                }
            }
            catch (error) {
                console.error(`❌ [SaveOAuthTokens] Error saving OAuth tokens for doctor ${doctorId}:`, error);
                throw new Error(`Failed to save OAuth tokens: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    /**
     * Obtiene el estado de conexión del calendario de Google para un doctor
     */
    static getCalendarConnectionStatus(doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`🔍 [CalendarStatus] Checking connection status for doctor: ${doctorId}`);
                const doctor = yield doctor_model_1.Doctor.findOne({ id: doctorId });
                if (!doctor) {
                    console.log(`❌ [CalendarStatus] Doctor not found with ID: ${doctorId}`);
                    return { isConnected: false };
                }
                console.log(`✅ [CalendarStatus] Doctor found: ${doctor.name} (${doctor.email})`);
                if (!doctor.calendar || !doctor.calendar.oauth) {
                    console.log(`❌ [CalendarStatus] No calendar OAuth data found for doctor: ${doctorId}`);
                    return { isConnected: false };
                }
                const oauth = doctor.calendar.oauth;
                console.log(`📋 [CalendarStatus] OAuth data found for doctor ${doctorId}:`, {
                    hasAccessToken: !!oauth.accessToken,
                    hasRefreshToken: !!oauth.refreshToken,
                    isActive: oauth.isActive,
                    expiryDate: oauth.expiryDate,
                    lastSync: oauth.lastSync,
                    nextSync: oauth.nextSync
                });
                if (!oauth.isActive) {
                    console.log(`❌ [CalendarStatus] OAuth is not active for doctor: ${doctorId}`);
                    return { isConnected: false };
                }
                if (!oauth.refreshToken) {
                    console.log(`❌ [CalendarStatus] No refresh token found for doctor: ${doctorId}`);
                    return { isConnected: false };
                }
                if (!oauth.accessToken) {
                    console.log(`⚠️ [CalendarStatus] No access token found for doctor: ${doctorId}, but has refresh token`);
                    return { isConnected: false };
                }
                // Check if access token is expired
                if (oauth.expiryDate && new Date(oauth.expiryDate) <= new Date()) {
                    console.log(`⚠️ [CalendarStatus] Access token expired for doctor: ${doctorId}, attempting refresh`);
                    try {
                        yield this.refreshAccessToken(doctorId);
                        console.log(`✅ [CalendarStatus] Access token refreshed successfully for doctor: ${doctorId}`);
                    }
                    catch (refreshError) {
                        console.error(`❌ [CalendarStatus] Failed to refresh access token for doctor: ${doctorId}:`, refreshError);
                        return { isConnected: false };
                    }
                }
                console.log(`✅ [CalendarStatus] Calendar is connected for doctor: ${doctorId}`);
                console.log(`📊 [CalendarStatus] Connection details:`, {
                    calendarName: oauth.calendarName || 'Primary Calendar',
                    lastSync: oauth.lastSync,
                    nextSync: oauth.nextSync,
                    totalEvents: 0 // TODO: Implement actual event count
                });
                return {
                    isConnected: true,
                    calendarName: oauth.calendarName,
                    lastSync: oauth.lastSync,
                    nextSync: oauth.nextSync,
                    totalEvents: 0, // TODO: Implement actual event count
                    refreshToken: oauth.refreshToken,
                    calendarId: oauth.calendarId,
                    accessToken: oauth.accessToken
                };
            }
            catch (error) {
                console.error(`❌ [CalendarStatus] Error getting calendar connection status for doctor ${doctorId}:`, error);
                return { isConnected: false };
            }
        });
    }
    /**
     * Refresca el token de acceso usando el refresh token
     */
    static refreshAccessToken(doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const doctor = yield doctor_model_1.Doctor.findOne({ id: doctorId });
                if (!doctor || !((_b = (_a = doctor.calendar) === null || _a === void 0 ? void 0 : _a.oauth) === null || _b === void 0 ? void 0 : _b.refreshToken)) {
                    throw new Error('No refresh token found for doctor');
                }
                const oauth2Client = new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CALENDAR_CLIENT_ID, process.env.GOOGLE_CALENDAR_CLIENT_SECRET, this.REDIRECT_URI);
                oauth2Client.setCredentials({
                    refresh_token: doctor.calendar.oauth.refreshToken
                });
                const { credentials } = yield oauth2Client.refreshAccessToken();
                if (!credentials.access_token) {
                    throw new Error('Failed to refresh access token');
                }
                // Update tokens in database
                const updateData = {
                    'calendar.oauth.accessToken': credentials.access_token,
                    'calendar.oauth.expiryDate': credentials.expiry_date ? new Date(credentials.expiry_date) : new Date(Date.now() + 3600000)
                };
                yield doctor_model_1.Doctor.findOneAndUpdate({ id: doctorId }, { $set: updateData });
                console.log(`✅ Access token refreshed for doctor: ${doctorId}`);
            }
            catch (error) {
                console.error('Error refreshing access token:', error);
                throw new Error(`Failed to refresh access token: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    /**
     * Desconecta el calendario de Google de un doctor
     */
    static disconnectCalendar(doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const updateData = {
                    'calendar.oauth.isActive': false,
                    'calendar.oauth.accessToken': null,
                    'calendar.oauth.refreshToken': null,
                    'calendar.oauth.expiryDate': null
                };
                const result = yield doctor_model_1.Doctor.findOneAndUpdate({ id: doctorId }, { $set: updateData }, { new: true });
                if (!result) {
                    throw new Error(`Doctor not found with ID: ${doctorId}`);
                }
                console.log(`✅ Calendar disconnected for doctor: ${doctorId}`);
            }
            catch (error) {
                console.error('Error disconnecting calendar:', error);
                throw new Error(`Failed to disconnect calendar: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    /**
     * Obtiene un cliente OAuth2 autenticado para un doctor
     */
    static getAuthenticatedClient(doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const doctor = yield doctor_model_1.Doctor.findOne({ id: doctorId });
                if (!doctor || !((_b = (_a = doctor.calendar) === null || _a === void 0 ? void 0 : _a.oauth) === null || _b === void 0 ? void 0 : _b.accessToken)) {
                    throw new Error('No OAuth tokens found for doctor');
                }
                const oauth2Client = new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CALENDAR_CLIENT_ID, process.env.GOOGLE_CALENDAR_CLIENT_SECRET, this.REDIRECT_URI);
                oauth2Client.setCredentials({
                    access_token: doctor.calendar.oauth.accessToken,
                    refresh_token: doctor.calendar.oauth.refreshToken
                });
                return oauth2Client;
            }
            catch (error) {
                console.error('Error getting authenticated client:', error);
                throw new Error(`Failed to get authenticated client: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
    }
    /**
     * Verifica si las variables de entorno están configuradas
     */
    static validateEnvironment() {
        const requiredVars = [
            'GOOGLE_CALENDAR_CLIENT_ID',
            'GOOGLE_CALENDAR_CLIENT_SECRET',
            'GOOGLE_CALENDAR_REDIRECT_URI'
        ];
        const missingVars = requiredVars.filter(varName => !process.env[varName]);
        if (missingVars.length > 0) {
            console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
            return false;
        }
        return true;
    }
}
exports.GoogleCalendarOAuthService = GoogleCalendarOAuthService;
GoogleCalendarOAuthService.SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
];
GoogleCalendarOAuthService.REDIRECT_URI = process.env.GOOGLE_CALENDAR_REDIRECT_URI || 'http://localhost:3002/api/doctors/calendar/callback';
exports.default = GoogleCalendarOAuthService;
