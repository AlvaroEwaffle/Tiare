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
exports.MercadoPagoService = void 0;
const mercadopago_1 = require("mercadopago");
class MercadoPagoService {
    constructor() {
        this.DEFAULT_PAYMENT_AMOUNT = 19970; // $19.970 CLP
        const accessToken = process.env.MP_ACCESS_TOKEN;
        if (!accessToken) {
            throw new Error('MP_ACCESS_TOKEN is not set');
        }
        this.client = new mercadopago_1.MercadoPagoConfig({ accessToken: accessToken });
    }
    createPayment(sessionId, paymentAmount) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const preference = new mercadopago_1.Preference(this.client);
                //Create a ID for the payment with the sessionId but taking out the -
                const amount = paymentAmount || this.DEFAULT_PAYMENT_AMOUNT;
                const response = yield preference.create({
                    body: {
                        items: [
                            {
                                id: "Ewaffle_IA",
                                title: "Diseño Curso e-learning",
                                unit_price: amount,
                                quantity: 1,
                                currency_id: "CLP"
                            }
                        ],
                        back_urls: {
                            failure: "https://creatucurso.ewaffle.cl/error",
                            pending: "https://creatucurso.ewaffle.cl/pending",
                            success: `https://creatucurso.ewaffle.cl/success/${sessionId}`,
                        },
                        auto_return: 'approved',
                        notification_url: "https://ew4experts-production.up.railway.app/api/sessions/webhook",
                        external_reference: sessionId,
                        metadata: {
                            sessionId
                        }
                    }
                });
                if (!response.id || !response.init_point) {
                    throw new Error('Invalid response from Mercado Pago');
                }
                console.log("=========================MERCADO PAGO CREATE PAYMENT =========================");
                console.log("createPayment Response:", response);
                console.log("createPayment Response ID:", response.id);
                console.log("createPayment Response init_point:", response.init_point);
                return {
                    id: String(response.id),
                    init_point: String(response.init_point)
                };
            }
            catch (error) {
                console.error('Error creating payment:', error);
                throw new Error('Failed to create payment preference');
            }
        });
    }
    verifyPayment(paymentId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Create a new Payment instance
                const payment = new mercadopago_1.Payment(this.client);
                console.log("=========================MERCADO PAGO VERIFY =========================");
                console.log("Verificando pago con ID:", paymentId);
                const paymentData = yield payment.get({ id: paymentId });
                if (!paymentData || !paymentData.status) {
                    console.log("No payment data received from Mercado Pago");
                    return { status: 'pending', external_reference: '' };
                }
                const status = paymentData.status;
                const external_reference = paymentData.external_reference || '';
                //We need to return the status and the external reference
                return { status: status, external_reference: external_reference };
            }
            catch (error) {
                console.error("Error verifying payment:", error);
                // Si el pago no existe, retorna false (no true)
                if (error.error === 'resource not found') {
                    console.log("Error finding payment in Mercado Pago. ");
                    return { status: 'pending', external_reference: '' };
                }
                throw new Error('Failed to verify payment');
            }
        });
    }
    handlePaymentNotification(paymentId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const isApproved = yield this.verifyPayment(paymentId);
                if (!isApproved) {
                    throw new Error('Payment not approved');
                }
            }
            catch (error) {
                console.error('Error handling payment notification:', error);
                throw error;
            }
        });
    }
}
exports.MercadoPagoService = MercadoPagoService;
