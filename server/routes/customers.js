import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * List / Search Customers
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });

    return res.json({ customers });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Create or Update Customer
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, phone, email, address, notes } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    const cleanName = name.trim();
    const cleanPhone = phone ? phone.trim() : null;

    // Check if customer already exists by phone or name
    let customer = null;
    if (cleanPhone) {
      customer = await prisma.customer.findFirst({ where: { phone: cleanPhone } });
    }
    if (!customer) {
      customer = await prisma.customer.findFirst({ where: { name: cleanName } });
    }

    if (customer) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          name: cleanName,
          ...(cleanPhone && { phone: cleanPhone }),
          ...(email && { email: email.trim() }),
          ...(address && { address: address.trim() }),
          ...(notes && { notes: notes.trim() }),
        }
      });
    } else {
      customer = await prisma.customer.create({
        data: {
          name: cleanName,
          phone: cleanPhone,
          email: email ? email.trim() : null,
          address: address ? address.trim() : null,
          notes: notes ? notes.trim() : null,
        }
      });
    }

    return res.status(201).json(customer);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
