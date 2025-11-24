"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimezoneService = void 0;
const date_fns_tz_1 = require("date-fns-tz");
class TimezoneService {
    /**
     * Convierte una fecha UTC a la zona horaria del usuario
     * @param utcDate - Fecha en UTC
     * @param userTimezone - Zona horaria del usuario (default: Chile)
     * @returns Fecha en la zona horaria del usuario
     */
    static convertToUserTimezone(utcDate, userTimezone = this.DEFAULT_TIMEZONE) {
        try {
            // Validar zona horaria
            if (!this.SUPPORTED_TIMEZONES.includes(userTimezone)) {
                console.warn(`⚠️ [TimezoneService] Unsupported timezone: ${userTimezone}, using default`);
                userTimezone = this.DEFAULT_TIMEZONE;
            }
            // Si la fecha ya está en UTC, convertir a zona del usuario
            return (0, date_fns_tz_1.toZonedTime)(utcDate, userTimezone);
        }
        catch (error) {
            console.error(`❌ [TimezoneService] Error converting to user timezone: ${error}`);
            return utcDate; // Fallback a fecha original
        }
    }
    /**
     * Convierte una fecha de zona horaria local a UTC
     * @param localDate - Fecha en zona horaria local
     * @param userTimezone - Zona horaria del usuario (default: Chile)
     * @returns Fecha en UTC
     */
    static convertToUTC(localDate, userTimezone = this.DEFAULT_TIMEZONE) {
        try {
            // Validar zona horaria
            if (!this.SUPPORTED_TIMEZONES.includes(userTimezone)) {
                console.warn(`⚠️ [TimezoneService] Unsupported timezone: ${userTimezone}, using default`);
                userTimezone = this.DEFAULT_TIMEZONE;
            }
            // Convertir de zona local a UTC usando fromZonedTime
            return (0, date_fns_tz_1.fromZonedTime)(localDate, userTimezone);
        }
        catch (error) {
            console.error(`❌ [TimezoneService] Error converting to UTC: ${error}`);
            return localDate; // Fallback a fecha original
        }
    }
    /**
     * Formatea una fecha UTC para mostrar en zona horaria del usuario
     * @param utcDate - Fecha en UTC
     * @param userTimezone - Zona horaria del usuario
     * @param formatString - Formato de fecha (default: ISO)
     * @returns Fecha formateada en zona horaria del usuario
     */
    static formatForUserTimezone(utcDate, userTimezone = this.DEFAULT_TIMEZONE, formatString = "yyyy-MM-dd'T'HH:mm:ss.SSSxxx") {
        try {
            const userDate = this.convertToUserTimezone(utcDate, userTimezone);
            return (0, date_fns_tz_1.format)(userDate, formatString, { timeZone: userTimezone });
        }
        catch (error) {
            console.error(`❌ [TimezoneService] Error formatting for user timezone: ${error}`);
            return utcDate.toISOString(); // Fallback a ISO string
        }
    }
    /**
     * Obtiene la zona horaria actual del usuario
     * @param userTimezone - Zona horaria del usuario
     * @returns Zona horaria validada
     */
    static getUserTimezone(userTimezone) {
        if (userTimezone && this.SUPPORTED_TIMEZONES.includes(userTimezone)) {
            return userTimezone;
        }
        return this.DEFAULT_TIMEZONE;
    }
    /**
     * Valida si una zona horaria es soportada
     * @param timezone - Zona horaria a validar
     * @returns true si es soportada
     */
    static isTimezoneSupported(timezone) {
        return this.SUPPORTED_TIMEZONES.includes(timezone);
    }
    /**
     * Obtiene todas las zonas horarias soportadas
     * @returns Array de zonas horarias soportadas
     */
    static getSupportedTimezones() {
        return [...this.SUPPORTED_TIMEZONES];
    }
    /**
     * Convierte una fecha ISO string a UTC
     * @param isoString - Fecha en formato ISO
     * @param userTimezone - Zona horaria del usuario
     * @returns Fecha en UTC
     */
    static parseISOToUTC(isoString, userTimezone = this.DEFAULT_TIMEZONE) {
        try {
            const localDate = new Date(isoString);
            return this.convertToUTC(localDate, userTimezone);
        }
        catch (error) {
            console.error(`❌ [TimezoneService] Error parsing ISO to UTC: ${error}`);
            return new Date(isoString); // Fallback a Date constructor
        }
    }
    /**
     * Obtiene el offset de zona horaria en minutos
     * @param userTimezone - Zona horaria del usuario
     * @returns Offset en minutos
     */
    static getTimezoneOffset(userTimezone = this.DEFAULT_TIMEZONE) {
        try {
            // Usar la función nativa de date-fns-tz
            return (0, date_fns_tz_1.getTimezoneOffset)(userTimezone);
        }
        catch (error) {
            console.error(`❌ [TimezoneService] Error getting timezone offset: ${error}`);
            return 0; // Fallback a 0 offset
        }
    }
}
exports.TimezoneService = TimezoneService;
// Zona horaria por defecto (Chile)
TimezoneService.DEFAULT_TIMEZONE = 'America/Santiago';
// Zonas horarias soportadas
TimezoneService.SUPPORTED_TIMEZONES = [
    'America/Santiago',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/Madrid',
    'Europe/London',
    'UTC'
];
