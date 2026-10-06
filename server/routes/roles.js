import express from 'express';
import prisma from '../database/prisma.js';
import { authenticateToken, hasPermission } from '../middleware/auth.js';

const router = express.Router();

/**
 * List all roles
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true }
        },
        _count: { select: { users: true } }
      },
      orderBy: { name: 'asc' },
    });

    const formatted = roles.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      usersCount: r._count.users,
      permissions: r.permissions.map(rp => rp.permission.code),
    }));

    return res.json({ roles: formatted });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * List all available system permissions
 */
router.get('/permissions', authenticateToken, async (req, res) => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ category: 'asc' }, { code: 'asc' }]
    });

    return res.json({ permissions });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Create dynamic role
 */
router.post('/', authenticateToken, hasPermission('users.create'), async (req, res) => {
  try {
    const { name, description, permissionCodes } = req.body;
    if (!name) return res.status(400).json({ error: 'Role name is required' });

    const existing = await prisma.role.findUnique({ where: { name } });
    if (existing) return res.status(400).json({ error: 'A role with this name already exists' });

    const role = await prisma.role.create({
      data: { name, description: description || '' }
    });

    if (Array.isArray(permissionCodes) && permissionCodes.length > 0) {
      const perms = await prisma.permission.findMany({
        where: { code: { in: permissionCodes } }
      });

      for (const p of perms) {
        await prisma.rolePermission.create({
          data: { roleId: role.id, permissionId: p.id }
        });
      }
    }

    return res.status(201).json(role);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Update role & permissions
 */
router.put('/:id', authenticateToken, hasPermission('users.edit'), async (req, res) => {
  try {
    const { name, description, permissionCodes } = req.body;
    const roleId = req.params.id;

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) return res.status(404).json({ error: 'Role not found' });

    await prisma.role.update({
      where: { id: roleId },
      data: {
        ...(name && !role.isSystem && { name }),
        ...(description !== undefined && { description }),
      }
    });

    if (Array.isArray(permissionCodes)) {
      // Remove old permissions
      await prisma.rolePermission.deleteMany({ where: { roleId } });

      const perms = await prisma.permission.findMany({
        where: { code: { in: permissionCodes } }
      });

      for (const p of perms) {
        await prisma.rolePermission.create({
          data: { roleId, permissionId: p.id }
        });
      }
    }

    return res.json({ message: 'Role updated successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
