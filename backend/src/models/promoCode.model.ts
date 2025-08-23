import mongoose, { Schema, Document } from 'mongoose';

export interface IPromoCode extends Document {
  code: string;
  discountPercentage: number;
  maxUses: number;
  currentUses: number;
  isActive: boolean;
  validFrom: Date;
  validUntil: Date;
  createdAt: Date;
  updatedAt: Date;
}

const promoCodeSchema = new Schema<IPromoCode>({
  code: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    trim: true
  },
  discountPercentage: { 
    type: Number, 
    required: true,
    min: 0,
    max: 100
  },
  maxUses: { 
    type: Number, 
    required: true,
    min: 1
  },
  currentUses: { 
    type: Number, 
    default: 0,
    min: 0
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  validFrom: { 
    type: Date, 
    required: true 
  },
  validUntil: { 
    type: Date, 
    required: true 
  }
}, {
  timestamps: true
});

// Index for faster queries
promoCodeSchema.index({ code: 1 });
promoCodeSchema.index({ isActive: 1 });

export const PromoCode = mongoose.model<IPromoCode>('PromoCode', promoCodeSchema); 