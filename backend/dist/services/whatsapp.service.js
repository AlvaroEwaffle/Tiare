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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppService = void 0;
const models_1 = require("../models");
const uuid_1 = require("uuid");
class WhatsAppService {
    /**
     * Send a WhatsApp message
     */
    static sendMessage(message, doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _b, _c, _d;
            if (!this.WHATSAPP_ACCESS_TOKEN || !this.WHATSAPP_PHONE_NUMBER_ID) {
                throw new Error('WhatsApp credentials not configured');
            }
            try {
                const url = `${this.WHATSAPP_BASE_URL}/${this.WHATSAPP_PHONE_NUMBER_ID}/messages`;
                const response = yield fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.WHATSAPP_ACCESS_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(Object.assign(Object.assign(Object.assign(Object.assign({ messaging_product: 'whatsapp', to: message.to, type: message.type }, (message.text && { text: { body: message.text } })), (message.template && { template: message.template })), (message.document && { document: message.document })), (message.image && { image: message.image })))
                });
                if (!response.ok) {
                    const errorData = yield response.json();
                    throw new Error(`WhatsApp API error: ${((_b = errorData.error) === null || _b === void 0 ? void 0 : _b.message) || 'Unknown error'}`);
                }
                const data = yield response.json();
                const messageId = (_d = (_c = data.messages) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.id;
                if (!messageId) {
                    throw new Error('Failed to get message ID from WhatsApp response');
                }
                // Log the message sent
                yield models_1.EventLog.create({
                    id: (0, uuid_1.v4)(),
                    level: 'info',
                    category: 'whatsapp',
                    action: 'message_sent',
                    userId: doctorId,
                    userType: doctorId ? 'doctor' : 'system',
                    resourceId: messageId,
                    resourceType: 'whatsapp_message',
                    details: {
                        to: message.to,
                        type: message.type,
                        messageId
                    }
                });
                return { messageId, status: 'sent' };
            }
            catch (error) {
                // Log the error
                yield models_1.EventLog.create({
                    id: (0, uuid_1.v4)(),
                    level: 'error',
                    category: 'whatsapp',
                    action: 'message_failed',
                    userId: doctorId,
                    userType: doctorId ? 'doctor' : 'system',
                    details: {
                        to: message.to,
                        type: message.type,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    }
                });
                throw error;
            }
        });
    }
    /**
     * Send appointment reminder
     */
    static sendAppointmentReminder(patientPhone, appointmentDetails, doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = {
                to: patientPhone,
                type: 'template',
                template: {
                    name: 'appointment_reminder',
                    language: { code: 'es' },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: appointmentDetails.doctorName },
                                { type: 'text', text: appointmentDetails.date },
                                { type: 'text', text: appointmentDetails.time },
                                { type: 'text', text: appointmentDetails.type }
                            ]
                        }
                    ]
                }
            };
            yield this.sendMessage(message, doctorId);
        });
    }
    /**
     * Send payment reminder
     */
    static sendPaymentReminder(patientPhone, billingDetails, doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = {
                to: patientPhone,
                type: 'template',
                template: {
                    name: 'payment_reminder',
                    language: { code: 'es' },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: billingDetails.doctorName },
                                { type: 'text', text: billingDetails.amount.toString() },
                                { type: 'text', text: billingDetails.dueDate },
                                { type: 'text', text: billingDetails.invoiceNumber }
                            ]
                        }
                    ]
                }
            };
            yield this.sendMessage(message, doctorId);
        });
    }
    /**
     * Send appointment confirmation
     */
    static sendAppointmentConfirmation(patientPhone, appointmentDetails, doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = {
                to: patientPhone,
                type: 'template',
                template: {
                    name: 'appointment_confirmation',
                    language: { code: 'es' },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                { type: 'text', text: appointmentDetails.doctorName },
                                { type: 'text', text: appointmentDetails.date },
                                { type: 'text', text: appointmentDetails.time },
                                { type: 'text', text: appointmentDetails.type },
                                ...(appointmentDetails.location ? [{ type: 'text', text: appointmentDetails.location }] : []),
                                ...(appointmentDetails.notes ? [{ type: 'text', text: appointmentDetails.notes }] : [])
                            ]
                        }
                    ]
                }
            };
            yield this.sendMessage(message, doctorId);
        });
    }
    /**
     * Send invoice document
     */
    static sendInvoice(patientPhone, invoiceDetails, doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = {
                to: patientPhone,
                type: 'document',
                document: {
                    link: invoiceDetails.documentUrl,
                    filename: invoiceDetails.filename,
                    caption: `Factura por consulta con ${invoiceDetails.doctorName}\nMonto: $${invoiceDetails.amount}\nVencimiento: ${invoiceDetails.dueDate}`
                }
            };
            yield this.sendMessage(message, doctorId);
        });
    }
    /**
     * Send simple text message
     */
    static sendTextMessage(patientPhone, text, doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            const message = {
                to: patientPhone,
                type: 'text',
                text
            };
            yield this.sendMessage(message, doctorId);
        });
    }
    /**
     * Verify webhook signature
     */
    static verifyWebhookSignature(body, signature, appSecret) {
        try {
            const crypto = require('crypto');
            const expectedSignature = crypto
                .createHmac('sha256', appSecret)
                .update(body)
                .digest('hex');
            return signature === expectedSignature;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Process incoming webhook messages
     */
    static processWebhookMessage(messageData, doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Log incoming message
                yield models_1.EventLog.create({
                    id: (0, uuid_1.v4)(),
                    level: 'info',
                    category: 'whatsapp',
                    action: 'message_received',
                    userId: doctorId,
                    userType: doctorId ? 'doctor' : 'system',
                    details: {
                        from: messageData.from,
                        messageType: messageData.type,
                        timestamp: messageData.timestamp
                    }
                });
                // Process different message types
                switch (messageData.type) {
                    case 'text':
                        yield this.handleTextMessage(messageData, doctorId);
                        break;
                    case 'button':
                        yield this.handleButtonMessage(messageData, doctorId);
                        break;
                    case 'interactive':
                        yield this.handleInteractiveMessage(messageData, doctorId);
                        break;
                    default:
                        console.log('Unhandled message type:', messageData.type);
                }
            }
            catch (error) {
                console.error('Error processing webhook message:', error);
            }
        });
    }
    /**
     * Handle incoming text messages
     */
    static handleTextMessage(messageData, doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _b;
            // This will be implemented based on the specific business logic
            // for handling patient interactions
            console.log('Processing text message:', (_b = messageData.text) === null || _b === void 0 ? void 0 : _b.body);
        });
    }
    /**
     * Handle incoming button messages
     */
    static handleButtonMessage(messageData, doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _b;
            // This will be implemented based on the specific business logic
            // for handling patient interactions
            console.log('Processing button message:', (_b = messageData.button) === null || _b === void 0 ? void 0 : _b.text);
        });
    }
    /**
     * Handle incoming interactive messages
     */
    static handleInteractiveMessage(messageData, doctorId) {
        return __awaiter(this, void 0, void 0, function* () {
            // This will be implemented based on the specific business logic
            // for handling patient interactions
            console.log('Processing interactive message:', messageData.interactive);
        });
    }
}
exports.WhatsAppService = WhatsAppService;
_a = WhatsAppService;
WhatsAppService.WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
WhatsAppService.WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
WhatsAppService.WHATSAPP_API_VERSION = 'v18.0';
WhatsAppService.WHATSAPP_BASE_URL = `https://graph.facebook.com/${_a.WHATSAPP_API_VERSION}`;
