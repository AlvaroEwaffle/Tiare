import { EventLog } from '../models';
import { v4 as uuidv4 } from 'uuid';

export interface WhatsAppMessage {
  to: string;
  type: 'text' | 'template' | 'document' | 'image';
  text?: string;
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: 'header' | 'body' | 'button';
      parameters?: Array<{
        type: 'text' | 'image' | 'document' | 'video';
        text?: string;
        image?: {
          link: string;
        };
        document?: {
          link: string;
          filename: string;
        };
      }>;
    }>;
  };
  document?: {
    link: string;
    filename: string;
    caption?: string;
  };
  image?: {
    link: string;
    caption?: string;
  };
}

export interface WhatsAppTemplate {
  name: string;
  language: string;
  category: 'marketing' | 'utility' | 'authentication';
  components: Array<{
    type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
    text?: string;
    format?: string;
    example?: string;
  }>;
}

export class WhatsAppService {
  private static readonly WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
  private static readonly WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
  private static readonly WHATSAPP_API_VERSION = 'v18.0';
  private static readonly WHATSAPP_BASE_URL = `https://graph.facebook.com/${this.WHATSAPP_API_VERSION}`;

  /**
   * Send a WhatsApp message
   */
  static async sendMessage(message: WhatsAppMessage, doctorId?: string): Promise<{ messageId: string; status: string }> {
    if (!this.WHATSAPP_ACCESS_TOKEN || !this.WHATSAPP_PHONE_NUMBER_ID) {
      throw new Error('WhatsApp credentials not configured');
    }

    try {
      const url = `${this.WHATSAPP_BASE_URL}/${this.WHATSAPP_PHONE_NUMBER_ID}/messages`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: message.to,
          type: message.type,
          ...(message.text && { text: { body: message.text } }),
          ...(message.template && { template: message.template }),
          ...(message.document && { document: message.document }),
          ...(message.image && { image: message.image })
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`WhatsApp API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const messageId = data.messages?.[0]?.id;

      if (!messageId) {
        throw new Error('Failed to get message ID from WhatsApp response');
      }

      // Log the message sent
      await EventLog.create({
        id: uuidv4(),
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
    } catch (error) {
      // Log the error
      await EventLog.create({
        id: uuidv4(),
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
  }

  /**
   * Send appointment reminder
   */
  static async sendAppointmentReminder(
    patientPhone: string,
    appointmentDetails: {
      date: string;
      time: string;
      type: string;
      doctorName: string;
    },
    doctorId: string
  ): Promise<void> {
    const message: WhatsAppMessage = {
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

    await this.sendMessage(message, doctorId);
  }

  /**
   * Send payment reminder
   */
  static async sendPaymentReminder(
    patientPhone: string,
    billingDetails: {
      amount: number;
      dueDate: string;
      invoiceNumber: string;
      doctorName: string;
    },
    doctorId: string
  ): Promise<void> {
    const message: WhatsAppMessage = {
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

    await this.sendMessage(message, doctorId);
  }

  /**
   * Send appointment confirmation
   */
  static async sendAppointmentConfirmation(
    patientPhone: string,
    appointmentDetails: {
      date: string;
      time: string;
      type: string;
      doctorName: string;
      location?: string;
      notes?: string;
    },
    doctorId: string
  ): Promise<void> {
    const message: WhatsAppMessage = {
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
              ...(appointmentDetails.location && [{ type: 'text', text: appointmentDetails.location }]),
              ...(appointmentDetails.notes && [{ type: 'text', text: appointmentDetails.notes }])
            ]
          }
        ]
      }
    };

    await this.sendMessage(message, doctorId);
  }

  /**
   * Send invoice document
   */
  static async sendInvoice(
    patientPhone: string,
    invoiceDetails: {
      documentUrl: string;
      filename: string;
      amount: number;
      dueDate: string;
      doctorName: string;
    },
    doctorId: string
  ): Promise<void> {
    const message: WhatsAppMessage = {
      to: patientPhone,
      type: 'document',
      document: {
        link: invoiceDetails.documentUrl,
        filename: invoiceDetails.filename,
        caption: `Factura por consulta con ${invoiceDetails.doctorName}\nMonto: $${invoiceDetails.amount}\nVencimiento: ${invoiceDetails.dueDate}`
      }
    };

    await this.sendMessage(message, doctorId);
  }

  /**
   * Send simple text message
   */
  static async sendTextMessage(
    patientPhone: string,
    text: string,
    doctorId?: string
  ): Promise<void> {
    const message: WhatsAppMessage = {
      to: patientPhone,
      type: 'text',
      text
    };

    await this.sendMessage(message, doctorId);
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(
    body: string,
    signature: string,
    appSecret: string
  ): boolean {
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', appSecret)
        .update(body)
        .digest('hex');

      return signature === expectedSignature;
    } catch (error) {
      return false;
    }
  }

  /**
   * Process incoming webhook messages
   */
  static async processWebhookMessage(
    messageData: any,
    doctorId?: string
  ): Promise<void> {
    try {
      // Log incoming message
      await EventLog.create({
        id: uuidv4(),
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
          await this.handleTextMessage(messageData, doctorId);
          break;
        case 'button':
          await this.handleButtonMessage(messageData, doctorId);
          break;
        case 'interactive':
          await this.handleInteractiveMessage(messageData, doctorId);
          break;
        default:
          console.log('Unhandled message type:', messageData.type);
      }
    } catch (error) {
      console.error('Error processing webhook message:', error);
    }
  }

  /**
   * Handle incoming text messages
   */
  private static async handleTextMessage(
    messageData: any,
    doctorId?: string
  ): Promise<void> {
    // This will be implemented based on the specific business logic
    // for handling patient interactions
    console.log('Processing text message:', messageData.text?.body);
  }

  /**
   * Handle incoming button messages
   */
  private static async handleButtonMessage(
    messageData: any,
    doctorId?: string
  ): Promise<void> {
    // This will be implemented based on the specific business logic
    // for handling patient interactions
    console.log('Processing button message:', messageData.button?.text);
  }

  /**
   * Handle incoming interactive messages
   */
  private static async handleInteractiveMessage(
    messageData: any,
    doctorId?: string
  ): Promise<void> {
    // This will be implemented based on the specific business logic
    // for handling patient interactions
    console.log('Processing interactive message:', messageData.interactive);
  }
}
