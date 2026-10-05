import express from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { sendOtpEmail } from '../services/emailService.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * 1. Request OTP Code for Email Login
 */
router.post('/request-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address. Please contact an administrator.' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Your account is deactivated.' });
    }

    // Generate 6-digit numeric OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate old unused OTPs for this email
    await prisma.otpCode.updateMany({
      where: { email: cleanEmail, used: false },
      data: { used: true },
    });

    // Save new OTP
    await prisma.otpCode.create({
      data: {
        email: cleanEmail,
        code,
        expiresAt,
      },
    });

    // Send Email (Resend -> SMTP -> Console simulation)
    const emailResult = await sendOtpEmail(cleanEmail, code);

    return res.json({
      message: 'Verification code sent to your email address.',
      email: cleanEmail,
      provider: emailResult.provider,
      // For development/demo, expose OTP if simulated
      devCode: emailResult.simulated ? code : undefined,
    });
  } catch (err) {
    console.error('Request OTP error:', err);
    return res.status(500).json({ error: 'Failed to process OTP request: ' + err.message });
  }
});

/**
 * 2. Verify OTP Code and Login
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and 6-digit verification code are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        email: cleanEmail,
        code: cleanCode,
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Mark OTP as used
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } }
          }
        },
        department: true,
        businessDivision: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'User account is inactive' });
    }

    const token = generateToken(user);
    const permissionCodes = user.role?.permissions.map(rp => rp.permission.code) || [];

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_OTP',
        entity: 'User',
        entityId: user.id,
        metadata: JSON.stringify({ email: cleanEmail }),
      },
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        profileImage: user.profileImage,
        role: user.role?.name,
        roleId: user.roleId,
        department: user.department?.name,
        departmentId: user.departmentId,
        permissions: permissionCodes,
        isAdmin: user.role?.name === 'Super Administrator' || user.role?.name === 'Administrator',
      },
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({ error: 'Failed to verify code: ' + err.message });
  }
});

/**
 * 3. Password Login Fallback
 */
router.post('/password-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } }
          }
        },
        department: true,
        businessDivision: true,
      },
    });

    if (!user || !user.passwordHash) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Your account is inactive' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    const permissionCodes = user.role?.permissions.map(rp => rp.permission.code) || [];

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_PASSWORD',
        entity: 'User',
        entityId: user.id,
      },
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        profileImage: user.profileImage,
        role: user.role?.name,
        roleId: user.roleId,
        department: user.department?.name,
        departmentId: user.departmentId,
        permissions: permissionCodes,
        isAdmin: user.role?.name === 'Super Administrator' || user.role?.name === 'Administrator',
      },
    });
  } catch (err) {
    console.error('Password login error:', err);
    return res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

/**
 * 4. Get Current User Info
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } }
          }
        },
        department: true,
        businessDivision: true,
      },
    });

    if (!user) {
      return res.status(444).json({ error: 'User not found' });
    }

    const permissionCodes = user.role?.permissions.map(rp => rp.permission.code) || [];

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        profileImage: user.profileImage,
        role: user.role?.name,
        roleId: user.roleId,
        department: user.department?.name,
        departmentId: user.departmentId,
        permissions: permissionCodes,
        isAdmin: user.role?.name === 'Super Administrator' || user.role?.name === 'Administrator',
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
