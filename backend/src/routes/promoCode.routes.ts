import { Router, Request, Response, RequestHandler } from 'express';
import {
  createPromoCode,
  listPromoCodes,
  getPromoCode,
  updatePromoCode,
  deletePromoCode
} from '../controllers/promoCode.controller';

const router = Router();

router.post('/', createPromoCode as RequestHandler);
router.get('/', listPromoCodes as RequestHandler);
router.get('/:id', getPromoCode as RequestHandler);
router.put('/:id', updatePromoCode as RequestHandler);
router.delete('/:id', deletePromoCode as RequestHandler);

export default router; 