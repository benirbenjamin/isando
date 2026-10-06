import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../database/prisma.js';
import { authenticateToken, hasPermission } from '../middleware/auth.js';
import { sendUserInviteEmail } from '../services/emailService.js';

const router = express.Router();

/**
 * List workers & users
 */
router.get('/', authenticateToken, hasPermission('users.view'), async (req, res) => {
  try {
    const { roleId, departmentId, search, status } = req.query;
    const where = {};

    if (roleId) where.roleId = roleId;
    if (departmentId) where.departmentId = departmentId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        profileImage: true,
        status: true,
        createdAt: true,
        role: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        businessDivision: { select: { id: true, name: true } },
      },
      orderBy: { fullName: 'asc' },
    });

    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Create new worker
 */
router.post('/', authenticateToken, hasPermission('users.create'), async (req, res) => {
  try {
    const { email, fullName, phone, password, roleId, departmentId, businessDivisionId, profileImage } = req.body;

    if (!email || !fullName || !roleId) {
      return res.status(400).json({ error: 'Email, Full Name, and Role are required' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    const defaultPass = password || 'Romantic2026!';
    const passwordHash = await bcrypt.hash(defaultPass, 10);

    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        fullName,
        phone: phone || null,
        passwordHash,
        roleId,
        departmentId: departmentId || null,
        businessDivisionId: businessDivisionId || null,
        profileImage: profileImage || null,
        status: 'ACTIVE',
      },
      include: {
        role: true,
        department: true,
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'USER_CREATED',
        entity: 'User',
        entityId: user.id,
        metadata: JSON.stringify({ email: user.email, role: user.role?.name }),
      }
    });

    return res.status(201).json({
      ...user,
      passwordHash: undefined,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Edit User profile / role / status
 */
router.put('/:id', authenticateToken, hasPermission('users.edit'), async (req, res) => {
  try {
    const { fullName, phone, roleId, departmentId, businessDivisionId, status, profileImage } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(fullName && { fullName }),
        ...(phone !== undefined && { phone }),
        ...(roleId && { roleId }),
        ...(departmentId !== undefined && { departmentId }),
        ...(businessDivisionId !== undefined && { businessDivisionId }),
        ...(status && { status }),
        ...(profileImage !== undefined && { profileImage }),
      },
      include: {
        role: true,
        department: true,
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'USER_UPDATED',
        entity: 'User',
        entityId: updated.id,
      }
    });

    return res.json({
      ...updated,
      passwordHash: undefined,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Reset User Password
 */
router.put('/:id/reset-password', authenticateToken, hasPermission('users.edit'), async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.params.id },
      data: { passwordHash }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'PASSWORD_RESET',
        entity: 'User',
        entityId: req.params.id,
      }
    });

    return res.json({ message: 'Password reset successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Update Current User Profile
 */
router.put('/profile/me', authenticateToken, async (req, res) => {
  try {
    const { fullName, phone, profileImage } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(fullName && { fullName }),
        ...(phone !== undefined && { phone }),
        ...(profileImage !== undefined && { profileImage }),
      }
    });

/**
 * Delete User Account
 */
router.delete('/:id', authenticateToken, hasPermission('users.edit'), async (req, res) => {
  try {
    const targetUserId = req.params.id;

    if (targetUserId === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { role: true },
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.email === 'admin@romantictsolutions.com') {
      return res.status(403).json({ error: 'The primary system Super Administrator cannot be deleted' });
    }

    // Clean up dependent records safely
    await prisma.otpCode.deleteMany({ where: { email: targetUser.email } }).catch(() => {});
    await prisma.notification.deleteMany({ where: { userId: targetUserId } }).catch(() => {});
    await prisma.conversationMember.deleteMany({ where: { userId: targetUserId } }).catch(() => {});
    await prisma.messageRead.deleteMany({ where: { userId: targetUserId } }).catch(() => {});
    await prisma.eventAssignment.deleteMany({ where: { userId: targetUserId } }).catch(() => {});
    await prisma.auditLog.deleteMany({ where: { userId: targetUserId } }).catch(() => {});

    await prisma.user.delete({
      where: { id: targetUserId },
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'USER_DELETED',
        entity: 'User',
        entityId: targetUserId,
        metadata: JSON.stringify({ email: targetUser.email, name: targetUser.fullName }),
      }
    }).catch(() => {});

    return res.json({ message: `User account '${targetUser.fullName}' deleted successfully` });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({ error: 'Failed to delete user: ' + err.message });
  }
});

export default router;
