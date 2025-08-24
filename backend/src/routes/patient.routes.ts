import { Router } from 'express';

const router = Router();

// Create new patient
router.post('/create', async (req, res) => {
  try {
    console.log('👶 Patient creation request received');
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    
    const { name, email, phone, notes } = req.body;

    // Validate required fields
    if (!name || !phone) {
      console.log('❌ Missing required fields: name and phone are required');
      return res.status(400).json({ 
        error: 'Missing required fields: name and phone are required' 
      });
    }

    console.log('✅ All required fields present, proceeding with patient creation...');
    console.log('👶 Patient data:', { name, email: email || 'Not provided', phone, notes: notes || 'Not provided' });

    // For now, we'll create a simple patient object without requiring doctor association
    // In a real app, you'd get the doctor ID from the authenticated session
    const patientId = require('uuid').v4();
    const patient = {
      id: patientId,
      name,
      email,
      phone,
      notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('✅ Patient created successfully:', patient.id);

    // Generate WhatsApp link
    const whatsappMessage = encodeURIComponent(`Hola ${name}! 👋 Soy el asistente virtual de Tiare. ¿En qué puedo ayudarte hoy?`);
    const whatsappLink = `https://wa.me/${phone.replace(/\D/g, '')}?text=${whatsappMessage}`;
    
    console.log('📱 WhatsApp link generated:', whatsappLink);

    res.status(201).json({
      message: 'Patient created successfully',
      patient: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        notes: patient.notes,
        createdAt: patient.createdAt
      },
      whatsappLink: whatsappLink,
      whatsappMessage: `Hola ${name}! 👋 Soy el asistente virtual de Tiare. ¿En qué puedo ayudarte hoy?`
    });

  } catch (error) {
    console.error('❌ Patient creation error:', error);
    console.error('🔍 Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

export default router;
