import { Request, Response, NextFunction } from 'express';
import { AuthService, JWTPayload } from '../services/auth.service';
import { EventLog } from '../models';
import { v4 as uuidv4 } from 'uuid';

// Extend Express Request interface to include user information
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      ipAddress?: string;
      userAgent?: string;
    }
  }
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = AuthService.extractTokenFromRequest(req);
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }

    try {
      const payload = AuthService.verifyToken(token);
      req.user = payload;
      next();
    } catch (error) {
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        code: 'TOKEN_INVALID'
      });
    }
  } catch (error) {
    return res.status(500).json({ 
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware to require specific user types
 */
export const requireUserType = (allowedTypes: ('doctor' | 'admin')[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!allowedTypes.includes(req.user.userType)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

/**
 * Middleware to require doctor role
 */
export const requireDoctor = requireUserType(['doctor', 'admin']);

/**
 * Middleware to require admin role
 */
export const requireAdmin = requireUserType(['admin']);

/**
 * Middleware to log requests for audit purposes
 */
export const logRequest = async (req: Request, res: Response, next: NextFunction) => {
  // Capture IP address and user agent
  req.ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
  req.userAgent = req.get('User-Agent') || 'unknown';

  // Log the request
  try {
    await EventLog.create({
      id: uuidv4(),
      level: 'info',
      category: 'system',
      action: `${req.method}_${req.path}`,
      userId: req.user?.userId,
      userType: req.user?.userType,
      ipAddress: req.ipAddress,
      userAgent: req.userAgent,
      details: {
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.method !== 'GET' ? req.body : undefined
      }
    });
  } catch (error) {
    // Don't fail the request if logging fails
    console.error('Failed to log request:', error);
  }

  next();
};

/**
 * Middleware to validate resource ownership
 */
export const validateResourceOwnership = (resourceType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const resourceId = req.params.id || req.params.doctorId;
    
    if (!resourceId) {
      return res.status(400).json({ 
        error: 'Resource ID required',
        code: 'RESOURCE_ID_MISSING'
      });
    }

    // For now, doctors can only access their own resources
    // This can be expanded for admin roles later
    if (req.user.userType === 'doctor' && req.user.userId !== resourceId) {
      return res.status(403).json({ 
        error: 'Access denied to this resource',
        code: 'ACCESS_DENIED'
      });
    }

    next();
  };
};

/**
 * Middleware to handle authentication errors
 */
export const handleAuthError = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      error: 'Invalid token',
      code: 'TOKEN_INVALID'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      error: 'Token expired',
      code: 'TOKEN_EXPIRED'
    });
  }

  next(error);
};
