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
 * Public & Admin: List all categories
 */
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        businessDivision: true,
        _count: { select: { products: true, services: true } },
      },
      orderBy: { name: 'asc' },
    });
    return res.json({ categories });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Public & Admin: Get category by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: {
        businessDivision: true,
        products: true,
        services: true,
      },
    });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    return res.json(category);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Admin: Update/Edit Category
 * PUT /api/categories/:id
 */
router.put('/:id', authenticateToken, hasPermission('products.create'), async (req, res) => {
  try {
    const categoryId = req.params.id;
    const { name, type, businessDivisionId } = req.body;

    const existing = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const updateData = {};
    if (name && name.trim()) {
      updateData.name = name.trim();
      let targetSlug = slugify(name.trim());
      const targetDivId = businessDivisionId || existing.businessDivisionId;

      if (targetSlug !== existing.slug || targetDivId !== existing.businessDivisionId) {
        const slugCollision = await prisma.category.findFirst({
          where: {
            slug: targetSlug,
            businessDivisionId: targetDivId,
            id: { not: categoryId },
          },
        }).catch(() => null);

        if (slugCollision) {
          targetSlug = `${targetSlug}-${Date.now().toString().slice(-4)}`;
        }
        updateData.slug = targetSlug;
      }
    }

    if (type) updateData.type = type;
    if (businessDivisionId) updateData.businessDivisionId = businessDivisionId;

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data: updateData,
      include: {
        businessDivision: true,
      },
    });

    return res.json(updated);
  } catch (err) {
    console.error('Update category error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Admin: Delete Category
 * DELETE /api/categories/:id
 */
router.delete('/:id', authenticateToken, hasPermission('products.create'), async (req, res) => {
  try {
    const categoryId = req.params.id;
    const existing = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Safely reassign linked products & services to another category in this division or fallback
    let fallbackCat = await prisma.category.findFirst({
      where: {
        businessDivisionId: existing.businessDivisionId,
        id: { not: categoryId },
      },
    }).catch(() => null);

    if (!fallbackCat) {
      fallbackCat = await prisma.category.create({
        data: {
          name: 'General',
          slug: 'general-' + Date.now().toString().slice(-4),
          type: existing.type,
          businessDivisionId: existing.businessDivisionId,
        },
      }).catch(() => null);
    }

    if (fallbackCat) {
      await prisma.product.updateMany({
        where: { categoryId },
        data: { categoryId: fallbackCat.id },
      }).catch(() => {});

      await prisma.service.updateMany({
        where: { categoryId },
        data: { categoryId: fallbackCat.id },
      }).catch(() => {});
    }

    await prisma.category.delete({ where: { id: categoryId } });

    return res.json({
      success: true,
      message: `Category '${existing.name}' deleted successfully`,
    });
  } catch (err) {
    console.error('Delete category error:', err);
    return res.status(500).json({ error: err.message });
  }
});

export default router;
