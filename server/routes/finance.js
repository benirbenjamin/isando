import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, hasPermission } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/summary', authenticateToken, hasPermission('finance.view'), async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        seller: { select: { id: true, fullName: true } },
        items: { include: { product: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalIncome = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const byMethod = {
      CASH: sales.filter(s => s.paymentMethod === 'CASH').reduce((sum, s) => sum + s.totalAmount, 0),
      MOMO: sales.filter(s => s.paymentMethod === 'MOMO').reduce((sum, s) => sum + s.totalAmount, 0),
      CARD: sales.filter(s => s.paymentMethod === 'CARD').reduce((sum, s) => sum + s.totalAmount, 0),
      BANK: sales.filter(s => s.paymentMethod === 'BANK').reduce((sum, s) => sum + s.totalAmount, 0),
    };

    return res.json({
      totalIncome,
      byMethod,
      recentTransactions: sales.slice(0, 30),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
