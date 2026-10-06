import express from 'express';
import prisma from '../database/prisma.js';
import { authenticateToken, hasPermission } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, hasPermission('audit.view'), async (req, res) => {
  try {
    const { action, entity, limit = 100 } = req.query;
    const where = {};
    if (action) where.action = action;
    if (entity) where.entity = entity;

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, email: true } }
      },
      orderBy: { timestamp: 'desc' },
      take: parseInt(limit, 10),
    });

    return res.json({ logs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
