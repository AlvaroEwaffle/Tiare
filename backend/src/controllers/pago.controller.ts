import { Request, Response } from 'express';
import { MercadoPagoService } from '../services/mercadoPago.service';
import { Session } from '../models/session.model';

export class PagoController {
  private mercadoPagoService: MercadoPagoService;

  constructor() {
    this.mercadoPagoService = new MercadoPagoService();
  }

  createPayment = (req: Request, res: Response) => {
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
    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(500).json({ error: 'Error creating payment' });
    }
  };

  handleWebhook = async (req: Request, res: Response) => {
    try {
      const { type, data } = req.body;

      if (type === 'payment') {
        const paymentId = data.id;
        const sessionId = data.metadata?.sessionId;

        if (!sessionId) {
          console.error('No sessionId found in payment metadata');
          return res.status(400).json({ error: 'No sessionId found' });
        }

        // Update session as paid
        await Session.findByIdAndUpdate(sessionId, { isPaid: true });
        console.log(`Session ${sessionId} marked as paid`);
      }

      res.status(200).send();
    } catch (error) {
      console.error('Error handling webhook:', error);
      res.status(500).json({ error: 'Error handling webhook' });
    }
  };
} 