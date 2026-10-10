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
    } catch (dbErr) {
      // Column sortOrder might be missing on remote DB, add it immediately!
      try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "BusinessDivision" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;`);
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
      } catch (retryErr) {
        // Fallback to raw query without sortOrder
        try {
          const rawDivs = await prisma.$queryRawUnsafe(`
            SELECT id, name, slug, description, image, tag, "createdAt"
            FROM "BusinessDivision"
            ORDER BY "createdAt" ASC
          `);
          const allCats = await prisma.category.findMany().catch(() => []);
          divisions = rawDivs.map(d => ({
            ...d,
            sortOrder: 0,
            categories: allCats.filter(c => c.businessDivisionId === d.id),
            _count: { products: 0, services: 0 }
          }));
        } catch {
          divisions = [];
        }
      }
    }
    return res.json({ divisions: divisions || [] });
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

    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "BusinessDivision" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;`);
    } catch {}

    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      try {
        await prisma.$executeRawUnsafe(`UPDATE "BusinessDivision" SET "sortOrder" = $1 WHERE "id" = $2;`, i, id);
      } catch {
        try {
          await prisma.businessDivision.update({
            where: { id },
            data: { sortOrder: i }
          });
        } catch (e) {
          console.warn(`Could not update sortOrder for division ${id}:`, e.message);
        }
      }
    }

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
        include: { categories: true },
        orderBy: { name: 'asc' }
      }).catch(() => []);
    }

    return res.json({ success: true, divisions: divisions || [] });
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

    let slug = slugify(name.trim());
    const slugCollision = await prisma.businessDivision.findFirst({ where: { slug } }).catch(() => null);
    if (slugCollision) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }
    
    // Ensure column exists
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "BusinessDivision" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;`);
    } catch {}

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
      let targetSlug = slugify(name.trim());
      if (targetSlug !== existing.slug) {
        const slugExists = await prisma.businessDivision.findFirst({
          where: { slug: targetSlug, id: { not: id } }
        }).catch(() => null);
        if (slugExists) {
          targetSlug = `${targetSlug}-${Date.now().toString().slice(-4)}`;
        }
        updateData.slug = targetSlug;
      }
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

    // Safely delete linked products, variants, services, and categories
    try {
      const prods = await prisma.product.findMany({ where: { businessDivisionId: id }, select: { id: true } });
      const prodIds = prods.map(p => p.id);
      if (prodIds.length > 0) {
        await prisma.inventoryTransaction.deleteMany({ where: { productId: { in: prodIds } } }).catch(() => {});
        await prisma.saleItem.deleteMany({ where: { productId: { in: prodIds } } }).catch(() => {});
        await prisma.productVariant.deleteMany({ where: { productId: { in: prodIds } } }).catch(() => {});
        await prisma.product.deleteMany({ where: { id: { in: prodIds } } }).catch(() => {});
      }
      await prisma.service.deleteMany({ where: { businessDivisionId: id } }).catch(() => {});
      await prisma.category.deleteMany({ where: { businessDivisionId: id } }).catch(() => {});
    } catch (cleanupErr) {
      console.warn('Cascade cleanup notice on division delete:', cleanupErr.message);
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

    let slug = slugify(name.trim());
    const existingCat = await prisma.category.findFirst({
      where: { slug, businessDivisionId }
    }).catch(() => null);
    if (existingCat) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

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

/**
 * Admin: Update/Edit Category
 * Supports PUT /categories/:categoryId and PUT /:divisionId/categories/:categoryId
 */
const handleUpdateCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId || req.params.id;
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
          where: { slug: targetSlug, businessDivisionId: targetDivId, id: { not: categoryId } }
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
      data: updateData
    });

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

router.put('/categories/:categoryId', authenticateToken, hasPermission('products.create'), handleUpdateCategory);
router.put('/:divisionId/categories/:categoryId', authenticateToken, hasPermission('products.create'), handleUpdateCategory);

/**
 * Admin: Delete Category
 * Supports DELETE /categories/:categoryId and DELETE /:divisionId/categories/:categoryId
 */
const handleDeleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId || req.params.id;
    const existing = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Safely reassign linked products & services to another category or create 'General' fallback
    let fallbackCat = await prisma.category.findFirst({
      where: { businessDivisionId: existing.businessDivisionId, id: { not: categoryId } }
    }).catch(() => null);

    if (!fallbackCat) {
      fallbackCat = await prisma.category.create({
        data: {
          name: 'General',
          slug: 'general-' + Date.now().toString().slice(-4),
          type: existing.type,
          businessDivisionId: existing.businessDivisionId
        }
      }).catch(() => null);
    }

    if (fallbackCat) {
      await prisma.product.updateMany({
        where: { categoryId },
        data: { categoryId: fallbackCat.id }
      }).catch(() => {});

      await prisma.service.updateMany({
        where: { categoryId },
        data: { categoryId: fallbackCat.id }
      }).catch(() => {});
    }

    await prisma.category.delete({ where: { id: categoryId } });

    return res.json({ success: true, message: `Category '${existing.name}' deleted successfully` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

router.delete('/categories/:categoryId', authenticateToken, hasPermission('products.create'), handleDeleteCategory);
router.delete('/:divisionId/categories/:categoryId', authenticateToken, hasPermission('products.create'), handleDeleteCategory);

export default router;
