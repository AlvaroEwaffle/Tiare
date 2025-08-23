import { Request, Response } from 'express';
import { PromoCode } from '../models/promoCode.model';

export const createPromoCode = async (req: Request, res: Response) => {
  try {
    const { code, discountPercentage, maxUses, validFrom, validUntil } = req.body;

    if (!code || !discountPercentage || !maxUses || !validFrom || !validUntil) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if code already exists
    const existingCode = await PromoCode.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({ error: 'Promotional code already exists' });
    }

    const promoCode = new PromoCode({
      code: code.toUpperCase(),
      discountPercentage,
      maxUses,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      isActive: true,
      currentUses: 0
    });

    await promoCode.save();

    res.status(201).json({
      message: 'Promotional code created successfully',
      promoCode
    });
  } catch (error) {
    console.error('Error creating promotional code:', error);
    res.status(500).json({ error: 'Error creating promotional code' });
  }
};

export const listPromoCodes = async (req: Request, res: Response) => {
  try {
    const promoCodes = await PromoCode.find().sort({ createdAt: -1 });
    res.json(promoCodes);
  } catch (error) {
    console.error('Error listing promotional codes:', error);
    res.status(500).json({ error: 'Error listing promotional codes' });
  }
};

export const getPromoCode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const promoCode = await PromoCode.findById(id);
    
    if (!promoCode) {
      return res.status(404).json({ error: 'Promotional code not found' });
    }

    res.json(promoCode);
  } catch (error) {
    console.error('Error getting promotional code:', error);
    res.status(500).json({ error: 'Error getting promotional code' });
  }
};

export const updatePromoCode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const promoCode = await PromoCode.findByIdAndUpdate(id, updates, { new: true });
    
    if (!promoCode) {
      return res.status(404).json({ error: 'Promotional code not found' });
    }

    res.json({
      message: 'Promotional code updated successfully',
      promoCode
    });
  } catch (error) {
    console.error('Error updating promotional code:', error);
    res.status(500).json({ error: 'Error updating promotional code' });
  }
};

export const deletePromoCode = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const promoCode = await PromoCode.findByIdAndDelete(id);
    
    if (!promoCode) {
      return res.status(404).json({ error: 'Promotional code not found' });
    }

    res.json({ message: 'Promotional code deleted successfully' });
  } catch (error) {
    console.error('Error deleting promotional code:', error);
    res.status(500).json({ error: 'Error deleting promotional code' });
  }
}; 