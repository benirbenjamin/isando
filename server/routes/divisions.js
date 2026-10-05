import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, hasPermission } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

function slugify(text) {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

/**
 * Public & Admin: List divisions with categories
 */
router.get('/', async (req, res) => {
  try {
    const divisions = await prisma.businessDivision.findMany({
      include: {
        categories: true,
        _count: { select: { products: true, services: true } }
      },
      orderBy: { name: 'asc' }
    });
    return res.json({ divisions });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Admin: Create new Business Division
 */
router.post('/', authenticateToken, hasPermission('products.create'), async (req, res) => {
  try {
    const { name, description, image, tag } = req.body;
    if (!name) return res.status(400).json({ error: 'Division name is required' });

    const slug = slugify(name);
    const division = await prisma.businessDivision.create({
      data: {
        name,
        slug,
        description: description || '',
        image: image || null,
        tag: tag || null,
      }
    });

    return res.status(201).json(division);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Admin: Create Category inside Division
 */
router.post('/:id/categories', authenticateToken, hasPermission('products.create'), async (req, res) => {
  try {
    const { name, type } = req.body;
    const businessDivisionId = req.params.id;

    if (!name) return res.status(400).json({ error: 'Category name is required' });

    const slug = slugify(name);
    const category = await prisma.category.create({
      data: {
        name,
        slug,
        type: type || 'PRODUCT',
        businessDivisionId,
      }
    });

    return res.status(201).json(category);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
