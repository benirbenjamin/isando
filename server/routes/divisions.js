import express from 'express';
import prisma from '../database/prisma.js';
import { authenticateToken, hasPermission } from '../middleware/auth.js';

const router = express.Router();

function slugify(text) {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

/**
 * Public & Admin: List divisions with categories, sorted by sortOrder
 */
router.get('/', async (req, res) => {
  try {
    let divisions;
    try {
      divisions = await prisma.businessDivision.findMany({
        include: {
          categories: true,
          _count: { select: { products: true, services: true } }
        },
        orderBy: [
          { sortOrder: 'asc' },
          { createdAt: 'asc' }
        ]
      });
    } catch {
      divisions = await prisma.businessDivision.findMany({
        include: {
          categories: true,
          _count: { select: { products: true, services: true } }
        },
        orderBy: { name: 'asc' }
      });
    }
    return res.json({ divisions });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Admin: Reorder divisions (drag & drop / slide / move up/down / move to top)
 */
router.put('/reorder', authenticateToken, hasPermission('products.create'), async (req, res) => {
  try {
    const { orderedIds, items } = req.body;
    const ids = orderedIds || (Array.isArray(items) ? items.map(it => it.id) : null);

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Valid array of orderedIds is required' });
    }

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      try {
        await prisma.businessDivision.update({
          where: { id },
          data: { sortOrder: i }
        });
      } catch (e) {
        console.warn(`Could not update sortOrder for division ${id}:`, e.message);
      }
    }

    const divisions = await prisma.businessDivision.findMany({
      include: {
        categories: true,
        _count: { select: { products: true, services: true } }
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'asc' }
      ]
    }).catch(async () => {
      return await prisma.businessDivision.findMany({
        include: { categories: true },
        orderBy: { name: 'asc' }
      });
    });

    return res.json({ success: true, divisions });
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
    
    // Count existing divisions to set sortOrder at the end
    const count = await prisma.businessDivision.count().catch(() => 0);

    const division = await prisma.businessDivision.create({
      data: {
        name: name.trim(),
        slug,
        description: description || '',
        image: image || null,
        tag: tag || null,
        sortOrder: count,
      }
    });

    return res.status(201).json(division);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Admin: Update/Edit Business Division
 */
router.put('/:id', authenticateToken, hasPermission('products.create'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image, tag, sortOrder } = req.body;

    const existing = await prisma.businessDivision.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Division not found' });
    }

    const updateData = {};
    if (name && name.trim()) {
      updateData.name = name.trim();
      updateData.slug = slugify(name.trim());
    }
    if (description !== undefined) updateData.description = description;
    if (image !== undefined) updateData.image = image;
    if (tag !== undefined) updateData.tag = tag;
    if (typeof sortOrder === 'number') updateData.sortOrder = sortOrder;

    const updated = await prisma.businessDivision.update({
      where: { id },
      data: updateData,
      include: {
        categories: true,
        _count: { select: { products: true, services: true } }
      }
    });

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Admin: Delete Business Division
 */
router.delete('/:id', authenticateToken, hasPermission('products.create'), async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.businessDivision.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true, services: true, categories: true } }
      }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Division not found' });
    }
    if ((existing._count?.products || 0) > 0 || (existing._count?.services || 0) > 0) {
      return res.status(400).json({
        error: 'Cannot delete division with active products or services. Please reassign or delete them first.'
      });
    }

    await prisma.businessDivision.delete({ where: { id } });
    return res.json({ success: true, message: `Division '${existing.name}' deleted successfully` });
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
        name: name.trim(),
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
