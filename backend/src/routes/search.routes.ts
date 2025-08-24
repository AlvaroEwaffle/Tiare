import { Router } from 'express';
import { SearchService } from '../services/search.service';
import { AuthService } from '../services/auth.service';

const router = Router();

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = AuthService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('❌ Invalid token:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Search user by exact phone number
router.get('/phone/:phoneNumber', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Phone search request received');
    console.log('📱 Phone number:', req.params.phoneNumber);
    console.log('👤 Requested by:', req.user?.email || 'Unknown');
    
    const { phoneNumber } = req.params;

    if (!phoneNumber || phoneNumber.trim().length === 0) {
      console.log('❌ Empty phone number provided');
      return res.status(400).json({ 
        error: 'Phone number is required' 
      });
    }

    console.log('🔍 Searching for user with phone:', phoneNumber);
    const result = await SearchService.searchByPhoneNumber(phoneNumber);

    if (!result) {
      console.log('❌ No user found with phone:', phoneNumber);
      return res.status(404).json({ 
        error: 'No user found with this phone number',
        phoneNumber: phoneNumber
      });
    }

    console.log('✅ User found:', { type: result.type, name: result.user.name, id: result.user.id });

    res.status(200).json({
      message: 'User found successfully',
      result: {
        type: result.type,
        user: result.user
      }
    });

  } catch (error) {
    console.error('❌ Phone search error:', error);
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

// Search users by partial phone number
router.get('/phone-partial/:partialPhone', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Partial phone search request received');
    console.log('📱 Partial phone:', req.params.partialPhone);
    console.log('👤 Requested by:', req.user?.email || 'Unknown');
    
    const { partialPhone } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!partialPhone || partialPhone.trim().length < 3) {
      console.log('❌ Partial phone too short:', partialPhone);
      return res.status(400).json({ 
        error: 'Partial phone number must be at least 3 characters' 
      });
    }

    console.log('🔍 Searching for users with partial phone:', partialPhone);
    const results = await SearchService.searchByPartialPhone(partialPhone, limit);

    console.log('✅ Found', results.length, 'users matching partial phone');

    res.status(200).json({
      message: `Found ${results.length} users`,
      results: results,
      searchTerm: partialPhone,
      limit: limit
    });

  } catch (error) {
    console.error('❌ Partial phone search error:', error);
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
