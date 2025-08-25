import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { AppointmentService } from '../services/appointment.service';

const router = express.Router();

// TEMPORARY DEBUG ENDPOINT - Remove in production
router.get('/debug', async (req, res) => {
  try {
    console.log('🔍 [DEBUG] Appointment debug endpoint called');
    
    const { Appointment } = require('../models');
    const allAppointments = await Appointment.find({}).lean();
    console.log('🔍 [DEBUG] All appointments in database:', allAppointments.length);
    console.log('🔍 [DEBUG] Sample appointment data:', allAppointments.slice(0, 2));
    
    res.json({
      success: true,
      debug: {
        totalAppointments: allAppointments.length,
        sampleAppointments: allAppointments.slice(0, 5),
        message: 'Debug endpoint - check server logs for details'
      }
    });
  } catch (error) {
    console.error('❌ [DEBUG] Error in appointment debug endpoint:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Debug error'
    });
  }
});

/**
 * POST /api/appointments
 * Create a new appointment
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const doctorId = req.user?.userId;
    if (!doctorId) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found in token'
      });
    }

    const { patientId, dateTime, duration, type, notes } = req.body;

    // Validate required fields
    if (!patientId || !dateTime || !duration || !type) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: patientId, dateTime, duration, type'
      });
    }

    // Validate consultation type
    if (!['presential', 'remote', 'home'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid consultation type. Must be: presential, remote, or home'
      });
    }

    // Validate duration
    if (duration < 15 || duration > 480) { // 15 minutes to 8 hours
      return res.status(400).json({
        success: false,
        error: 'Invalid duration. Must be between 15 and 480 minutes'
      });
    }

    // Validate dateTime is in the future
    const appointmentDateTime = new Date(dateTime);
    const now = new Date();
    if (appointmentDateTime <= now) {
      return res.status(400).json({
        success: false,
        error: 'Appointment date and time must be in the future'
      });
    }

    console.log('🔧 [Create Appointment] Creating appointment:', {
      doctorId,
      patientId,
      dateTime: appointmentDateTime,
      duration,
      type,
      notes
    });

    // Create appointment
    const appointment = await AppointmentService.createAppointment({
      doctorId,
      patientId,
      dateTime: appointmentDateTime,
      duration,
      type,
      notes: notes || ''
    });

    console.log('✅ [Create Appointment] Appointment created successfully:', appointment.id);

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: appointment
    });

  } catch (error) {
    console.error('❌ [Create Appointment] Error creating appointment:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create appointment'
    });
  }
});

/**
 * GET /api/appointments
 * Get all appointments for the authenticated doctor
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const doctorId = req.user?.userId;
    if (!doctorId) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found in token'
      });
    }

    const { status, patientId, startDate, endDate } = req.query;

    console.log('🔧 [Get Appointments] Fetching appointments for doctor:', doctorId);

    // Get appointments
    const appointments = await AppointmentService.getAppointmentsByDoctor(doctorId, {
      status: status as any,
      patientId: patientId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined
    });

    console.log('✅ [Get Appointments] Found', appointments.length, 'appointments');

    res.json({
      success: true,
      data: {
        appointments,
        totalCount: appointments.length
      }
    });

  } catch (error) {
    console.error('❌ [Get Appointments] Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch appointments'
    });
  }
});

/**
 * GET /api/appointments/:id
 * Get a specific appointment by ID
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const doctorId = req.user?.userId;
    const appointmentId = req.params.id;

    if (!doctorId) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found in token'
      });
    }

    console.log('🔧 [Get Appointment] Fetching appointment:', appointmentId, 'for doctor:', doctorId);

    // Get appointment
    const appointment = await AppointmentService.getAppointmentById(appointmentId, doctorId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    console.log('✅ [Get Appointment] Appointment found:', appointment.id);

    res.json({
      success: true,
      data: appointment
    });

  } catch (error) {
    console.error('❌ [Get Appointment] Error fetching appointment:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch appointment'
    });
  }
});

/**
 * PUT /api/appointments/:id
 * Update an appointment
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const doctorId = req.user?.userId;
    const appointmentId = req.params.id;

    if (!doctorId) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found in token'
      });
    }

    const updateData = req.body;

    console.log('🔧 [Update Appointment] Updating appointment:', appointmentId, 'for doctor:', doctorId);

    // Update appointment
    const appointment = await AppointmentService.updateAppointment(appointmentId, doctorId, updateData);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    console.log('✅ [Update Appointment] Appointment updated successfully:', appointment.id);

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: appointment
    });

  } catch (error) {
    console.error('❌ [Update Appointment] Error updating appointment:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update appointment'
    });
  }
});

/**
 * DELETE /api/appointments/:id
 * Cancel an appointment
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const doctorId = req.user?.userId;
    const appointmentId = req.params.id;
    const { reason } = req.body;

    if (!doctorId) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found in token'
      });
    }

    console.log('🔧 [Cancel Appointment] Cancelling appointment:', appointmentId, 'for doctor:', doctorId);

    // Cancel appointment
    const appointment = await AppointmentService.cancelAppointment(appointmentId, doctorId, reason);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    console.log('✅ [Cancel Appointment] Appointment cancelled successfully:', appointment.id);

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: appointment
    });

  } catch (error) {
    console.error('❌ [Cancel Appointment] Error cancelling appointment:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel appointment'
    });
  }
});

/**
 * GET /api/appointments/availability/:doctorId
 * Get available time slots for a doctor
 */
router.get('/availability/:doctorId', authenticateToken, async (req, res) => {
  try {
    const requestingDoctorId = req.user?.userId;
    const targetDoctorId = req.params.doctorId;

    if (!requestingDoctorId) {
      return res.status(401).json({
        success: false,
        error: 'User ID not found in token'
      });
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query parameters: startDate, endDate'
      });
    }

    console.log('🔧 [Get Availability] Fetching availability for doctor:', targetDoctorId);

    // Get availability
    const availability = await AppointmentService.getDoctorAvailability(
      targetDoctorId,
      new Date(startDate as string),
      new Date(endDate as string)
    );

    console.log('✅ [Get Availability] Found', availability.length, 'availability slots');

    res.json({
      success: true,
      data: {
        availability,
        totalSlots: availability.length
      }
    });

  } catch (error) {
    console.error('❌ [Get Availability] Error fetching availability:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch availability'
    });
  }
});





// TEMPORARY TEST ENDPOINT - Test hybrid availability checking
router.post('/test-availability', async (req, res) => {
  try {
    console.log('🧪 [TEST] Testing hybrid availability checking');
    
    const { doctorId, dateTime, duration } = req.body;
    
    if (!doctorId || !dateTime || !duration) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: doctorId, dateTime, duration'
      });
    }

    console.log('🧪 [TEST] Checking availability for:', {
      doctorId,
      dateTime,
      duration
    });

    // Test the new hybrid availability checking
    const isAvailable = await AppointmentService.checkAvailability(
      doctorId,
      new Date(dateTime),
      duration
    );

    console.log('✅ [TEST] Availability check completed:', isAvailable);

    res.json({
      success: true,
      isAvailable,
      message: `Time slot is ${isAvailable ? 'available' : 'not available'}`
    });

  } catch (error) {
    console.error('❌ [TEST] Error testing availability:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to test availability'
    });
  }
});

export default router;
