import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, hasPermission } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Public & Admin: List services
 */
router.get('/', async (req, res) => {
  try {
    const { division, category, search, isFeatured, limit = 50 } = req.query;

    const where = { status: 'ACTIVE' };

    if (division) {
      where.businessDivision = {
        OR: [
          { slug: division },
          { name: { contains: division } }
        ]
      };
    }

    if (category) {
      where.category = {
        OR: [
          { slug: category },
          { name: { contains: category } }
        ]
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ];
    }

    if (isFeatured === 'true') where.isFeatured = true;

    const services = await prisma.service.findMany({
      where,
      include: {
        businessDivision: true,
        category: true,
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit, 10),
    });

    const formatted = services.map(s => ({
      ...s,
      images: JSON.parse(s.images || '[]'),
      features: JSON.parse(s.features || '[]'),
    }));

    return res.json({ services: formatted });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Public & Admin: Single service detail
 */
router.get('/:id', async (req, res) => {
  try {
    const service = await prisma.service.findUnique({
      where: { id: req.params.id },
      include: {
        businessDivision: true,
        category: true,
      }
    });

    if (!service) return res.status(404).json({ error: 'Service not found' });

    return res.json({
      ...service,
      images: JSON.parse(service.images || '[]'),
      features: JSON.parse(service.features || '[]'),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Admin: Create Service
 */
router.post('/', authenticateToken, hasPermission('services.create'), async (req, res) => {
  try {
    const { name, description, businessDivisionId, categoryId, images, location, startingPrice, features, icon, isFeatured } = req.body;

    if (!name || !businessDivisionId || !categoryId) {
      return res.status(400).json({ error: 'Name, Business Division, and Category are required' });
    }

    const service = await prisma.service.create({
      data: {
        name,
        description: description || '',
        businessDivisionId,
        categoryId,
        images: JSON.stringify(Array.isArray(images) ? images : (images ? [images] : [])),
        location: location || 'Kigali & nationwide',
        startingPrice: startingPrice ? parseFloat(startingPrice) : null,
        features: JSON.stringify(Array.isArray(features) ? features : []),
        icon: icon || null,
        isFeatured: Boolean(isFeatured),
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'SERVICE_CREATED',
        entity: 'Service',
        entityId: service.id,
      }
    });

    return res.status(201).json(service);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Admin: Update Service
 */
router.put('/:id', authenticateToken, hasPermission('services.edit'), async (req, res) => {
  try {
    const { name, description, businessDivisionId, categoryId, images, location, startingPrice, features, icon, isFeatured, status } = req.body;

    const updated = await prisma.service.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(businessDivisionId && { businessDivisionId }),
        ...(categoryId && { categoryId }),
        ...(images && { images: JSON.stringify(Array.isArray(images) ? images : [images]) }),
        ...(location !== undefined && { location }),
        startingPrice: startingPrice !== undefined ? (startingPrice ? parseFloat(startingPrice) : null) : undefined,
        ...(features && { features: JSON.stringify(Array.isArray(features) ? features : []) }),
        ...(icon !== undefined && { icon }),
        ...(isFeatured !== undefined && { isFeatured: Boolean(isFeatured) }),
        ...(status && { status }),
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'SERVICE_UPDATED',
        entity: 'Service',
        entityId: updated.id,
      }
    });

    return res.json(updated);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Admin: Delete Service
 */
router.delete('/:id', authenticateToken, hasPermission('services.delete'), async (req, res) => {
  try {
    await prisma.service.update({
      where: { id: req.params.id },
      data: { status: 'DELETED' }
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'SERVICE_DELETED',
        entity: 'Service',
        entityId: req.params.id,
      }
    });

    return res.json({ message: 'Service deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
