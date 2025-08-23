import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Session } from '../models/session.model';
import { PromoCode } from '../models/promoCode.model';
import { generateSession, generatePremiumSession } from '../services/openai.service';
import { MercadoPagoService } from '../services/mercadoPago.service';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { Payment } from 'mercadopago';
import { sendSlackNotification } from '../utils/slack';

// MongoDB connection string (replace with your actual connection string)
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/comousarchatgpt';

// Connect to MongoDB using Mongoose
mongoose.connect(uri)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error: Error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

const mercadoPagoService = new MercadoPagoService();

export const createSession = async (req: Request, res: Response) => {
  try {
    const { name, email, service, strengths, targetAudience, results } = req.body;

    if (!name || !email || !service || !strengths || !targetAudience || !results) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const sessionId = uuidv4();

    // Generate value proposition using OpenAI
    const { valueProp } = await generateSession({
      nombre: name,
      email: email,
      servicio: service,
      fortalezas: strengths,
      audiencia: targetAudience,
      resultados: results
    });

    // Remove trailing commas before parsing
    let safeValueProp = valueProp.replace(/,\s*([}\]])/g, '$1');
    let parsed;
    try {
      parsed = JSON.parse(safeValueProp);
    } catch (e) {
      console.error('Error parsing OpenAI response:', e, safeValueProp);
      return res.status(500).json({ error: 'Invalid response from OpenAI' });
    }

    // Create session data using the new schema
    const session = new Session({
      id: sessionId,
      name,
      email,
      service,
      strengths,
      targetAudience,
      results,
      propuesta_valor: parsed.propuesta_valor || '',
      descripcion_potencia_ia: parsed.descripcion_potencia_ia || '',
      ideas_IA: parsed.ideas_IA || [],
      pro: {
        propuesta_valor_pro: parsed.propuesta_valor_pro || {},
        mapa_servicio: parsed.mapa_servicio || {},
        prompt_ejemplo: parsed.prompt_ejemplo || [],
        infografia: parsed.infografia || {},
        checklist_servicio: parsed.checklist_servicio || {},
        landing_page: parsed.landing_page || {},
      },
      isPaid: false,
      premium_development: false,
      createdAt: new Date()
    });

    // Notificar a Slack
    await sendSlackNotification(`
      🆕 Nueva sesión creada: ${service} - 
       Puedes ver el restulado en https://creatucurso.ewaffle.cl/preview/${sessionId}  
       Nombre: ${name} - Email: ${email} - 
       Servicio: ${service} - 
       Strengths: ${strengths} - 
       Target Audience: ${targetAudience} - 
       Resultados: ${results}`)
       ;

    console.log("Session created:", session);

    // Save session to MongoDB
    await session.save();
    

    res.status(201).json({
      sessionId,
      preview: {
        propuesta_valor: parsed.propuesta_valor || '',
        descripcion_potencia_ia: parsed.descripcion_potencia_ia || '',
        ideas_IA: parsed.ideas_IA || []
      },
      pro: {
        propuesta_valor_pro: parsed.propuesta_valor_pro || {},
        mapa_servicio: parsed.mapa_servicio || {},
        prompt_ejemplo: parsed.prompt_ejemplo || [],
        infografia: parsed.infografia || {},
        checklist_servicio: parsed.checklist_servicio || {},
        landing_page: parsed.landing_page || {},
      },
      isPaid: false
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSessionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const session = await Session.findOne({ id });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Always return the new structured format
    res.json({
      sessionId: session.id,
      preview: {
        propuesta_valor: session.propuesta_valor,
        descripcion_potencia_ia: session.descripcion_potencia_ia,
        ideas_IA: session.ideas_IA
      },
      pro: session.pro,
      isPaid: session.isPaid
    });
  } catch (error) {
    console.error('Error getting session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const paySession = async (req: Request, res: Response) => {
  console.log("=== PAY SESSION ===");
  console.log("Body:", req.body);
  console.log("Body sessionId:", req.body.sessionId);
  try {
    const { sessionId, promoCode } = req.body;
    const session = await Session.findOne({ id: sessionId });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.isPaid) {
      return res.status(400).json({ error: 'Session already paid' });
    }

    // Check if promotional code gives 100% discount
    if (promoCode && session.promoCodeApplied && session.promoCode === promoCode) {
      const promo = await PromoCode.findOne({ code: promoCode.toUpperCase() });
      if (promo && promo.discountPercentage === 100) {
        // For 100% discount, bypass payment and mark as paid directly
        session.isPaid = true;
        await session.save();
        
        // Notificar a Slack
        await sendSlackNotification(`🎁 Sesión gratuita activada: ${sessionId} con código promocional: ${promoCode}`);
        
        return res.json({
          success: true,
          freeAccess: true,
          message: 'Acceso gratuito activado'
        });
      }
    }

    // Calculate payment amount based on promotional code
    let paymentAmount = 19970; // Default price $19.970 CLP
    
    if (promoCode && session.promoCodeApplied && session.promoCode === promoCode) {
      const promo = await PromoCode.findOne({ code: promoCode.toUpperCase() });
      if (promo) {
        const discountAmount = Math.round(paymentAmount * (promo.discountPercentage / 100));
        paymentAmount = paymentAmount - discountAmount;
        console.log(`Applied promotional code ${promoCode}: ${promo.discountPercentage}% discount, new price: ${paymentAmount}`);
      }
    }

    const response = await mercadoPagoService.createPayment(sessionId, paymentAmount);
    // Guardar el paymentId en la sesión
    session.paymentId = response.id;
    await session.save();
    // Notificar a Slack
    await sendSlackNotification(`💳 Pago iniciado para sesión: ${sessionId} (paymentId: ${response.id})${promoCode ? ` con código promocional: ${promoCode}` : ''}`);
    // Treat response as an object with id and init_point
    return res.json({
      success: true,
      init_point: response.init_point,
      preference_id: response.id
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Error creating payment' });
  }
};

export const getPremiumResult = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findOne({ id: sessionId });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Only allow if paid
    if (!session.isPaid) {
      return res.status(403).json({ error: 'Session not paid' });
    }

    // If already generated, return it
    if (session.premium_development) {
      await sendSlackNotification(`⭐️ Acceso a premium entregado para sesión: ${sessionId}`);
      return res.json({
        sessionId: session.id,
        preview: {
          propuesta_valor: session.propuesta_valor,
          descripcion_potencia_ia: session.descripcion_potencia_ia,
          ideas_IA: session.ideas_IA
        },
        pro: session.pro,
        isPaid: session.isPaid
      });
    }

    // Generate premium result using structured preview fields
    const premiumData = await generatePremiumSession({
      servicio: session.service,
      fortalezas: session.strengths,
      audiencia: session.targetAudience,
      resultados: session.results,
      preview: {
        propuesta_valor: session.propuesta_valor,
        descripcion_potencia_ia: session.descripcion_potencia_ia,
        ideas_IA: session.ideas_IA
      }
    });

    // Save premium data in session.pro
    session.pro = premiumData;
    session.premium_development = true;
    await session.save();
    // Notificar a Slack
    await sendSlackNotification(`⭐️ Premium generado y entregado para sesión: ${sessionId}`);

    res.json({
      sessionId: session.id,
      preview: {
        propuesta_valor: session.propuesta_valor,
        descripcion_potencia_ia: session.descripcion_potencia_ia,
        ideas_IA: session.ideas_IA
      },
      pro: session.pro,
      isPaid: session.isPaid
    });
  } catch (error) {
    console.error('Error getting premium result:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const getPaymentStatus = async (req: Request, res: Response) => {
  console.log("=== GET PAYMENT STATUS ===");
  console.log("Params sessionId:", req.params.sessionId);

  try {
    const { sessionId } = req.params;
    console.log(`[getPaymentStatus] Checking status for sessionId: ${sessionId}`);
    const session = await Session.findOne({ id: sessionId });

    if (!session) {
      console.log(`[getPaymentStatus] Session not found: ${sessionId}`);
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Si la sesión ya está pagada, retorna inmediatamente
    if (session.isPaid) {
      console.log(`[getPaymentStatus] Session already marked as paid: ${sessionId}`);
      res.json({ status: 'paid' });
      return;
    }

    // Si no está pagada, retornar que no esta pagada

    if (!session.isPaid) {
      console.log(`[getPaymentStatus] No paymentId found for session: ${sessionId}`);
      res.json({ status: 'pending' });
      return;
    }
  } catch (error) {
    console.error('[getPaymentStatus] Error getting payment status:', error);
    res.status(500).json({ error: 'Error getting payment status' });
    return;
  }
}

export const webhookPago = async (req: Request, res: Response) => {
  console.log("=== WEBHOOK RECIBIDO ===");
  try {
    // Obtenemos el cuerpo de la petición que incluye información sobre la notificación
    const body: { data: { id: string } } = req.body;
    console.log("Body data id:", body.data.id);

    // Obtenemos el pago
    const isPaid = await mercadoPagoService.verifyPayment(body.data.id);
    console.log("isPaid:", isPaid);
    console.log("External reference:", isPaid.external_reference);

    // Process payment
    console.log("=== PROCESANDO PAGO ===");
    console.log("isPaid:", isPaid);
    console.log("External reference:", isPaid.external_reference);

    if (!isPaid) {
      console.log("Payment not approved");
      return res.status(200).send('OK');
    }

    const session = await Session.findOne({ id: isPaid.external_reference });
    if (!session) {
      console.log("Session not found");
      return res.status(200).send('OK');
    }
    session.isPaid = true;
    await session.save();

    return res.status(200).send('OK');
  } catch (error) {
    console.error('=== ERROR PROCESANDO WEBHOOK ===');
    console.error('Error details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const validatePromoCode = async (req: Request, res: Response) => {
  try {
    const { sessionId, promoCode } = req.body;

    if (!sessionId || !promoCode) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Session ID and promotional code are required' 
      });
    }

    // Find the session
    const session = await Session.findOne({ id: sessionId });
    if (!session) {
      return res.status(404).json({ 
        valid: false, 
        error: 'Session not found' 
      });
    }

    // Check if promotional code is already applied
    if (session.promoCodeApplied) {
      return res.status(400).json({ 
        valid: false, 
        error: 'A promotional code has already been applied to this session' 
      });
    }

    // Find the promotional code
    const promo = await PromoCode.findOne({ 
      code: promoCode.toUpperCase(),
      isActive: true
    });

    if (!promo) {
      return res.status(404).json({ 
        valid: false, 
        error: 'Código promocional no válido' 
      });
    }

    // Check if promotional code is within valid date range
    const now = new Date();
    if (now < promo.validFrom || now > promo.validUntil) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Código promocional expirado o no válido aún' 
      });
    }

    // Check if promotional code has reached maximum uses
    if (promo.currentUses >= promo.maxUses) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Código promocional agotado' 
      });
    }

    // Apply promotional code to session
    session.promoCode = promo.code;
    session.promoCodeApplied = true;
    await session.save();

    // Increment usage count
    promo.currentUses += 1;
    await promo.save();

    // Calculate discounted price
    const originalPrice = 19970; // $19.970 CLP
    const discountAmount = Math.round(originalPrice * (promo.discountPercentage / 100));
    const discountedPrice = originalPrice - discountAmount;

    // Special message for 100% discount
    let message = `¡Código aplicado! Descuento del ${promo.discountPercentage}% aplicado`;
    if (promo.discountPercentage === 100) {
      message = `¡Código aplicado! Acceso gratuito activado - No se requiere pago`;
    }

    return res.json({
      valid: true,
      message: message,
      discountPercentage: promo.discountPercentage,
      originalPrice,
      discountedPrice,
      discountAmount,
      isFreeAccess: promo.discountPercentage === 100
    });

  } catch (error) {
    console.error('Error validating promotional code:', error);
    res.status(500).json({ 
      valid: false, 
      error: 'Error interno del servidor' 
    });
  }
};

export const requestCourseProduction = async (req: Request, res: Response) => {
  try {
    const { sessionId, additionalDetails } = req.body;

    if (!sessionId || !additionalDetails) {
      return res.status(400).json({ 
        error: 'Session ID and additional details are required' 
      });
    }

    // Find the session
    const session = await Session.findOne({ id: sessionId });
    if (!session) {
      return res.status(404).json({ 
        error: 'Session not found' 
      });
    }

    // Send Slack notification
    const slackMessage = `🎬 **NUEVA SOLICITUD DE PRODUCCIÓN DE CURSO**
    
**Usuario:**
• Nombre: ${session.name}
• Email: ${session.email}

**Detalles del Curso:**
• Servicio: ${session.service}
• Fortalezas: ${session.strengths}
• Audiencia: ${session.targetAudience}
• Resultados: ${session.results}

**Información Adicional:**
${additionalDetails}

**Sesión ID:** ${sessionId}
**Fecha:** ${new Date().toLocaleString('es-CL')}`;

    await sendSlackNotification(slackMessage);

    res.json({
      success: true,
      message: 'Solicitud enviada exitosamente. Nos pondremos en contacto contigo pronto.'
    });

  } catch (error) {
    console.error('Error requesting course production:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor' 
    });
  }
};
