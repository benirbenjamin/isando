import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, hasPermission } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: { _count: { select: { users: true } } },
      orderBy: { name: 'asc' }
    });
    return res.json({ departments });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, hasPermission('settings.manage'), async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Department name is required' });

    const department = await prisma.department.create({
      data: { name, description: description || '' }
    });
    return res.status(201).json(department);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
