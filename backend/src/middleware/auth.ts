import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import prisma from '../services/prisma';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
  userRole?: string;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    // Verify user still exists in DB and fetch role
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true }
    });
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists. Please log in again.' });
    }

    req.userId = decoded.userId;
    req.userRole = user.role;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      req.userId = decoded.userId;
    } catch (error) {
      // Token invalid, but that's okay for optional auth
    }
  }
  next();
};

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

export const requireAdmin = requireRole('admin');
export const requirePremium = requireRole('admin', 'premium');

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};
