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
exports.deletePromoCode = exports.updatePromoCode = exports.getPromoCode = exports.listPromoCodes = exports.createPromoCode = void 0;
const promoCode_model_1 = require("../models/promoCode.model");
const createPromoCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { code, discountPercentage, maxUses, validFrom, validUntil } = req.body;
        if (!code || !discountPercentage || !maxUses || !validFrom || !validUntil) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        // Check if code already exists
        const existingCode = yield promoCode_model_1.PromoCode.findOne({ code: code.toUpperCase() });
        if (existingCode) {
            return res.status(400).json({ error: 'Promotional code already exists' });
        }
        const promoCode = new promoCode_model_1.PromoCode({
            code: code.toUpperCase(),
            discountPercentage,
            maxUses,
            validFrom: new Date(validFrom),
            validUntil: new Date(validUntil),
            isActive: true,
            currentUses: 0
        });
        yield promoCode.save();
        res.status(201).json({
            message: 'Promotional code created successfully',
            promoCode
        });
    }
    catch (error) {
        console.error('Error creating promotional code:', error);
        res.status(500).json({ error: 'Error creating promotional code' });
    }
});
exports.createPromoCode = createPromoCode;
const listPromoCodes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const promoCodes = yield promoCode_model_1.PromoCode.find().sort({ createdAt: -1 });
        res.json(promoCodes);
    }
    catch (error) {
        console.error('Error listing promotional codes:', error);
        res.status(500).json({ error: 'Error listing promotional codes' });
    }
});
exports.listPromoCodes = listPromoCodes;
const getPromoCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const promoCode = yield promoCode_model_1.PromoCode.findById(id);
        if (!promoCode) {
            return res.status(404).json({ error: 'Promotional code not found' });
        }
        res.json(promoCode);
    }
    catch (error) {
        console.error('Error getting promotional code:', error);
        res.status(500).json({ error: 'Error getting promotional code' });
    }
});
exports.getPromoCode = getPromoCode;
const updatePromoCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updates = req.body;
        const promoCode = yield promoCode_model_1.PromoCode.findByIdAndUpdate(id, updates, { new: true });
        if (!promoCode) {
            return res.status(404).json({ error: 'Promotional code not found' });
        }
        res.json({
            message: 'Promotional code updated successfully',
            promoCode
        });
    }
    catch (error) {
        console.error('Error updating promotional code:', error);
        res.status(500).json({ error: 'Error updating promotional code' });
    }
});
exports.updatePromoCode = updatePromoCode;
const deletePromoCode = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const promoCode = yield promoCode_model_1.PromoCode.findByIdAndDelete(id);
        if (!promoCode) {
            return res.status(404).json({ error: 'Promotional code not found' });
        }
        res.json({ message: 'Promotional code deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting promotional code:', error);
        res.status(500).json({ error: 'Error deleting promotional code' });
    }
});
exports.deletePromoCode = deletePromoCode;
