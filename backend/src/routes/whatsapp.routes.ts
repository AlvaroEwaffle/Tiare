import { Router } from 'express';
import { WhatsAppService } from '../services/whatsapp.service';

const router = Router();

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const APP_SECRET = process.env.WHATSAPP_APP_SECRET;

/**
 * GET /api/whatsapp/webhook
 * Endpoint de verificación de webhook para Meta/Facebook.
 *
 * Meta enviará: hub.mode, hub.verify_token, hub.challenge
 * Debemos devolver hub.challenge si el verify_token coincide.
 */
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (!VERIFY_TOKEN) {
    console.error('❌ [WhatsApp Webhook] WHATSAPP_VERIFY_TOKEN no está configurado en el entorno');
    return res.status(500).send('Verify token not configured');
  }

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ [WhatsApp Webhook] Verificación de webhook exitosa');
    return res.status(200).send(challenge);
  }

  console.warn('⚠️ [WhatsApp Webhook] Verificación fallida', { mode, token });
  return res.sendStatus(403);
});

/**
 * POST /api/whatsapp/webhook
 * Endpoint para recibir eventos de WhatsApp Cloud API.
 *
 * - Opcionalmente valida la firma X-Hub-Signature-256 usando APP_SECRET.
 * - Extrae los mensajes del payload y los pasa a WhatsAppService.processWebhookMessage.
 */
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-hub-signature-256'] as string | undefined;

    if (APP_SECRET && signature) {
      const isValid = WhatsAppService.verifyWebhookSignature(
        JSON.stringify(req.body),
        signature.replace('sha256=', ''),
        APP_SECRET
      );

      if (!isValid) {
        console.warn('⚠️ [WhatsApp Webhook] Firma inválida');
        return res.sendStatus(403);
      }
    } else if (APP_SECRET && !signature) {
      console.warn('⚠️ [WhatsApp Webhook] Falta cabecera X-Hub-Signature-256');
    }

    const body = req.body;

    if (body.object !== 'whatsapp_business_account') {
      console.log('ℹ️ [WhatsApp Webhook] Evento ignorado (object distinto a whatsapp_business_account)');
      return res.sendStatus(200);
    }

    // Estructura estándar de WhatsApp Cloud API:
    // entry[0].changes[0].value.messages[0]
    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value;
        const messages = value?.messages || [];

        for (const message of messages) {
          const messageData = {
            from: message.from,
            type: message.type,
            timestamp: message.timestamp,
            text: message.text,
            button: message.button,
            interactive: message.interactive,
            raw: message
          };

          // Por ahora no tenemos doctorId asociado al webhook; se puede resolver más adelante.
          await WhatsAppService.processWebhookMessage(messageData);
        }
      }
    }

    // Meta requiere un 200 OK rápido para considerar entregado el webhook.
    return res.sendStatus(200);
  } catch (error) {
    console.error('❌ [WhatsApp Webhook] Error procesando webhook:', error);
    return res.sendStatus(500);
  }
});

export default router;


