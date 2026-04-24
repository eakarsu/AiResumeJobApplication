import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../services/prisma';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth';
import {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
} from '../middleware/validate';

const router = Router();

// Register
router.post('/register', registerValidation, async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone, location } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const emailVerificationToken = uuidv4();

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        location,
        isEmailVerified: false,
        emailVerificationToken,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        location: true,
        isPremium: true,
        role: true,
        isEmailVerified: true,
        createdAt: true
      }
    });

    const token = generateToken(user.id);

    // Log verification link to console (replace with email service in production)
    console.log(`[Email Verification] http://localhost:5173/verify-email?token=${emailVerificationToken}`);

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'user_registered',
        entityType: 'user',
        entityId: user.id
      }
    });

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', loginValidation, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'user_login',
        entityType: 'user',
        entityId: user.id
      }
    });

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Logout
router.post('/logout', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.activityLog.create({
      data: {
        userId: req.userId!,
        action: 'user_logout',
        entityType: 'user',
        entityId: req.userId!
      }
    });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.json({ message: 'Logged out successfully' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        location: true,
        linkedinUrl: true,
        portfolioUrl: true,
        avatarUrl: true,
        isPremium: true,
        premiumTier: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { firstName, lastName, phone, location, linkedinUrl, portfolioUrl, avatarUrl } = req.body;

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        firstName,
        lastName,
        phone,
        location,
        linkedinUrl,
        portfolioUrl,
        avatarUrl
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        location: true,
        linkedinUrl: true,
        portfolioUrl: true,
        avatarUrl: true,
        isPremium: true,
        premiumTier: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.put('/password', authenticateToken, changePasswordValidation, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Forgot password
router.post('/forgot-password', forgotPasswordValidation, async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return 200 to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      }
    });

    // Log reset link to console (replace with email service in production)
    console.log(`[Password Reset] http://localhost:5173/reset-password?token=${token}`);

    res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// Reset password
router.post('/reset-password', resetPasswordValidation, async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword }
    });

    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true }
    });

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Verify email
router.get('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    if (user.isEmailVerified) {
      return res.json({ message: 'Email already verified' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null
      }
    });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// Resend verification email
router.post('/resend-verification', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.json({ message: 'Email already verified' });
    }

    const newToken = uuidv4();
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken: newToken }
    });

    console.log(`[Email Verification] http://localhost:5173/verify-email?token=${newToken}`);

    res.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

export default router;
