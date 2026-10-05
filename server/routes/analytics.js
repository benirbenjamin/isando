import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, hasPermission } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/overview', authenticateToken, hasPermission('reports.view'), async (req, res) => {
  try {
    const [
      totalProducts,
      totalServices,
      totalWorkers,
      activeEvents,
      lowStockCount,
      outOfStockCount,
      sales,
      events
    ] = await Promise.all([
      prisma.product.count({ where: { status: 'ACTIVE' } }),
      prisma.service.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.event.count({ where: { status: { in: ['LIVE', 'CONFIRMED', 'PLANNING'] } } }),
      prisma.product.count({ where: { status: 'ACTIVE', stockQuantity: { gt: 0, lte: 5 } } }),
      prisma.product.count({ where: { status: 'ACTIVE', stockQuantity: 0 } }),
      prisma.sale.findMany({
        include: { items: { include: { product: { include: { businessDivision: true } } } } }
      }),
      prisma.event.findMany({ select: { eventType: true, status: true } })
    ]);

    const totalRevenue = sales.reduce((acc, s) => acc + s.totalAmount, 0);

    // Division Sales distribution
    const divisionRevenue = {};
    for (const sale of sales) {
      for (const item of sale.items) {
        const divName = item.product?.businessDivision?.name || 'General';
        divisionRevenue[divName] = (divisionRevenue[divName] || 0) + item.totalPrice;
      }
    }

    // Payment methods breakdown
    const paymentMethods = {};
    for (const sale of sales) {
      paymentMethods[sale.paymentMethod] = (paymentMethods[sale.paymentMethod] || 0) + sale.totalAmount;
    }

    return res.json({
      metrics: {
        totalProducts,
        totalServices,
        totalWorkers,
        activeEvents,
        lowStockCount,
        outOfStockCount,
        totalSalesCount: sales.length,
        totalRevenue,
      },
      divisionRevenue,
      paymentMethods,
      eventStatusCount: {
        live: events.filter(e => e.status === 'LIVE').length,
        confirmed: events.filter(e => e.status === 'CONFIRMED').length,
        planning: events.filter(e => e.status === 'PLANNING').length,
        completed: events.filter(e => e.status === 'COMPLETED').length,
      }
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
