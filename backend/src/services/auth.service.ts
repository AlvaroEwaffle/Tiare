import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Doctor } from '../models';
import { EventLog } from '../models';
import { Request } from 'express';

export interface JWTPayload {
  userId: string;
  userType: 'doctor' | 'admin';
  email: string;
  specialization?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
  private static readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret';
  private static readonly ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';
  private static readonly REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
  private static readonly BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.BCRYPT_ROUNDS);
  }

  /**
   * Compare a password with a hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT tokens for a user
   */
  static generateTokens(payload: JWTPayload): AuthTokens {
    const accessToken = (jwt as any).sign(payload, this.JWT_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN
    });

    const refreshToken = (jwt as any).sign(payload, this.JWT_REFRESH_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN
    });

    return { accessToken, refreshToken };
  }

  /**
   * Verify and decode a JWT token
   */
  static verifyToken(token: string, isRefreshToken = false): JWTPayload {
    try {
      const secret = isRefreshToken ? this.JWT_REFRESH_SECRET : this.JWT_SECRET;
      const decoded = jwt.verify(token, secret) as JWTPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Refresh an access token using a refresh token
   */
  static refreshAccessToken(refreshToken: string): string {
    try {
      const payload = this.verifyToken(refreshToken, true);
      return (jwt as any).sign(payload, this.JWT_SECRET, {
        expiresIn: this.ACCESS_TOKEN_EXPIRES_IN
      });
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Register a new doctor
   */
  static async registerDoctor(doctorData: {
    name: string;
    email: string;
    password: string;
    specialization: string;
    licenseNumber: string;
    phone: string;
    address?: string;
  }): Promise<{ doctor: any; tokens: AuthTokens }> {
    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({ 
      $or: [{ email: doctorData.email }, { licenseNumber: doctorData.licenseNumber }] 
    });

    if (existingDoctor) {
      throw new Error('Doctor with this email or license number already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(doctorData.password);

    // Create doctor
    const doctor = new Doctor({
      id: uuidv4(),
      ...doctorData,
      password: hashedPassword
    });

    await doctor.save();

    // Generate tokens
    const payload: JWTPayload = {
      userId: doctor.id,
      userType: 'doctor',
      email: doctor.email,
      specialization: doctor.specialization
    };

    const tokens = this.generateTokens(payload);

    // Log the event
    await EventLog.create({
      id: uuidv4(),
      level: 'info',
      category: 'authentication',
      action: 'doctor_registered',
      userId: doctor.id,
      userType: 'doctor',
      resourceId: doctor.id,
      resourceType: 'doctor',
      details: { email: doctor.email, specialization: doctor.specialization }
    });

    return { doctor, tokens };
  }

  /**
   * Login a doctor
   */
  static async loginDoctor(email: string, password: string): Promise<{ doctor: any; tokens: AuthTokens }> {
    // Find doctor by email
    const doctor = await Doctor.findOne({ email, isActive: true });
    if (!doctor) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await this.comparePassword(password, doctor.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const payload: JWTPayload = {
      userId: doctor.id,
      userType: 'doctor',
      email: doctor.email,
      specialization: doctor.specialization
    };

    const tokens = this.generateTokens(payload);

    // Log the event
    await EventLog.create({
      id: uuidv4(),
      level: 'info',
      category: 'authentication',
      action: 'doctor_logged_in',
      userId: doctor.id,
      userType: 'doctor',
      resourceId: doctor.id,
      resourceType: 'doctor',
      details: { email: doctor.email }
    });

    return { doctor, tokens };
  }

  /**
   * Extract token from request headers
   */
  static extractTokenFromRequest(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }

  /**
   * Validate user permissions
   */
  static validateUserPermissions(userId: string, resourceId: string, resourceType: string): boolean {
    // For now, doctors can only access their own resources
    // This can be expanded for admin roles later
    return userId === resourceId || resourceType === 'doctor';
  }
}
