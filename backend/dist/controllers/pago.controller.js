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
exports.PagoController = void 0;
const mercadoPago_service_1 = require("../services/mercadoPago.service");
const session_model_1 = require("../models/session.model");
class PagoController {
    constructor() {
        this.createPayment = (req, res) => {
            try {
                const { sessionId } = req.body;
                if (!sessionId) {
                    return res.status(400).json({ error: 'Session ID is required' });
                }
                this.mercadoPagoService.createPayment(sessionId)
                    .then(checkoutUrl => res.json({ checkoutUrl }))
                    .catch(error => {
                    console.error('Error creating payment:', error);
                    res.status(500).json({ error: 'Error creating payment' });
                });
            }
            catch (error) {
                console.error('Error creating payment:', error);
                res.status(500).json({ error: 'Error creating payment' });
            }
        };
        this.handleWebhook = (req, res) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { type, data } = req.body;
                if (type === 'payment') {
                    const paymentId = data.id;
                    const sessionId = (_a = data.metadata) === null || _a === void 0 ? void 0 : _a.sessionId;
                    if (!sessionId) {
                        console.error('No sessionId found in payment metadata');
                        return res.status(400).json({ error: 'No sessionId found' });
                    }
                    // Update session as paid
                    yield session_model_1.Session.findByIdAndUpdate(sessionId, { isPaid: true });
                    console.log(`Session ${sessionId} marked as paid`);
                }
                res.status(200).send();
            }
            catch (error) {
                console.error('Error handling webhook:', error);
                res.status(500).json({ error: 'Error handling webhook' });
            }
        });
        this.mercadoPagoService = new mercadoPago_service_1.MercadoPagoService();
    }
}
exports.PagoController = PagoController;
