import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, hasPermission } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Helper to calculate discount percentage
function calcDiscount(regularPrice, salePrice) {
  if (!regularPrice || !salePrice || regularPrice <= salePrice) return 0;
  return Math.round(((regularPrice - salePrice) / regularPrice) * 100);
}

/**
 * Public & Admin: List products
 */
router.get('/', async (req, res) => {
  try {
    const { division, category, search, minPrice, maxPrice, isFeatured, isOnSale, isNewArrival, isPopular, limit = 50, offset = 0 } = req.query;

    const where = {
      status: 'ACTIVE',
    };

    if (division) {
      const foundDiv = await prisma.businessDivision.findFirst({
        where: {
          OR: [
            { slug: division },
            { name: division },
            { name: { contains: division } }
          ]
        }
      });
      if (foundDiv) {
        where.businessDivisionId = foundDiv.id;
      }
    }

    if (category) {
      const foundCat = await prisma.category.findFirst({
        where: {
          OR: [
            { slug: category },
            { name: category },
            { name: { contains: category } }
          ]
        }
      });
      if (foundCat) {
        where.categoryId = foundCat.id;
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { sku: { contains: search } }
      ];
    }

    if (isFeatured === 'true') where.isFeatured = true;
    if (isOnSale === 'true') where.isOnSale = true;
    if (isNewArrival === 'true') where.isNewArrival = true;
    if (isPopular === 'true') where.isPopular = true;

    if (minPrice || maxPrice) {
      where.salePrice = {};
      if (minPrice) where.salePrice.gte = parseFloat(minPrice);
      if (maxPrice) where.salePrice.lte = parseFloat(maxPrice);
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          businessDivision: true,
          category: true,
          variants: true,
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit, 10),
        skip: parseInt(offset, 10),
      })
    ]);

    const formatted = products.map(p => ({
      ...p,
      images: JSON.parse(p.images || '[]'),
    }));

    return res.json({ total, products: formatted });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Public & Admin: Get single product by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        businessDivision: true,
        category: true,
        variants: true,
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json({
      ...product,
      images: JSON.parse(product.images || '[]'),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Admin: Create Product
 */
router.post('/', authenticateToken, hasPermission('products.create'), async (req, res) => {
  try {
    const {
      name, sku, description, businessDivisionId, categoryId, images,
      regularPrice, salePrice, stockQuantity, lowStockThreshold,
      isFeatured, isNewArrival, isOnSale, isPopular, variants
    } = req.body;

    if (!name || !businessDivisionId || !categoryId) {
      return res.status(400).json({ error: 'Name, Business Division, and Category are required' });
    }

    const regP = parseFloat(regularPrice || 0);
    const saleP = parseFloat(salePrice || regP);

    if (saleP > regP && regP > 0) {
      return res.status(400).json({ error: 'Sale price cannot be greater than regular price' });
    }

    const discountPercentage = calcDiscount(regP, saleP);
    const generatedSku = sku || `PROD-${Date.now().toString().slice(-6)}`;

    const product = await prisma.product.create({
      data: {
        name,
        sku: generatedSku,
        description: description || '',
        businessDivisionId,
        categoryId,
        images: JSON.stringify(Array.isArray(images) ? images : (images ? [images] : [])),
        regularPrice: regP,
        salePrice: saleP,
        discountPercentage,
        stockQuantity: parseInt(stockQuantity || 0, 10),
        lowStockThreshold: parseInt(lowStockThreshold || 5, 10),
        isFeatured: Boolean(isFeatured),
        isNewArrival: Boolean(isNewArrival),
        isOnSale: Boolean(isOnSale) || discountPercentage > 0,
        isPopular: Boolean(isPopular),
      }
    });

    // Handle variants if supplied
    if (Array.isArray(variants) && variants.length > 0) {
      for (const v of variants) {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            size: v.size || null,
            color: v.color || null,
            sku: v.sku || `${generatedSku}-${v.size || ''}-${v.color || ''}`,
            stockQuantity: parseInt(v.stockQuantity || 0, 10),
            priceOverride: v.priceOverride ? parseFloat(v.priceOverride) : null,
          }
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'PRODUCT_CREATED',
        entity: 'Product',
        entityId: product.id,
        metadata: JSON.stringify({ name: product.name, sku: product.sku }),
      }
    });

    return res.status(201).json(product);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Admin: Update Product
 */
router.put('/:id', authenticateToken, hasPermission('products.edit'), async (req, res) => {
  try {
    const {
      name, sku, description, businessDivisionId, categoryId, images,
      regularPrice, salePrice, stockQuantity, lowStockThreshold,
      isFeatured, isNewArrival, isOnSale, isPopular, status
    } = req.body;

    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    const regP = regularPrice !== undefined ? parseFloat(regularPrice) : existing.regularPrice;
    const saleP = salePrice !== undefined ? parseFloat(salePrice) : existing.salePrice;

    if (saleP > regP && regP > 0) {
      return res.status(400).json({ error: 'Sale price cannot be greater than regular price' });
    }

    const discountPercentage = calcDiscount(regP, saleP);

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(sku && { sku }),
        ...(description !== undefined && { description }),
        ...(businessDivisionId && { businessDivisionId }),
        ...(categoryId && { categoryId }),
        ...(images && { images: JSON.stringify(Array.isArray(images) ? images : [images]) }),
        regularPrice: regP,
        salePrice: saleP,
        discountPercentage,
        ...(stockQuantity !== undefined && { stockQuantity: parseInt(stockQuantity, 10) }),
        ...(lowStockThreshold !== undefined && { lowStockThreshold: parseInt(lowStockThreshold, 10) }),
        ...(isFeatured !== undefined && { isFeatured: Boolean(isFeatured) }),
        ...(isNewArrival !== undefined && { isNewArrival: Boolean(isNewArrival) }),
        ...(isOnSale !== undefined && { isOnSale: Boolean(isOnSale) || discountPercentage > 0 }),
        ...(isPopular !== undefined && { isPopular: Boolean(isPopular) }),
        ...(status && { status }),
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'PRODUCT_UPDATED',
        entity: 'Product',
        entityId: updated.id,
      }
    });

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Admin: Delete Product
 */
router.delete('/:id', authenticateToken, hasPermission('products.delete'), async (req, res) => {
  try {
    await prisma.product.update({
      where: { id: req.params.id },
      data: { status: 'DELETED' }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'PRODUCT_DELETED',
        entity: 'Product',
        entityId: req.params.id,
      }
    });

    return res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
