import express from 'express';
import prisma from '../database/prisma.js';
import { authenticateToken, hasPermission } from '../middleware/auth.js';

const router = express.Router();

/**
 * Get inventory status summary & low stock products
 */
router.get('/status', authenticateToken, hasPermission('inventory.view'), async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      include: {
        businessDivision: true,
        category: true,
        variants: true,
      }
    });

    const lowStock = [];
    const outOfStock = [];
    let totalStockItems = 0;

    for (const p of products) {
      totalStockItems += p.stockQuantity;

      if (p.stockQuantity === 0) {
        outOfStock.push({ ...p, images: JSON.parse(p.images || '[]') });
      } else if (p.stockQuantity <= p.lowStockThreshold) {
        lowStock.push({ ...p, images: JSON.parse(p.images || '[]') });
      }
    }

    return res.json({
      totalProducts: products.length,
      totalStockItems,
      lowStockCount: lowStock.length,
      outOfStockCount: outOfStock.length,
      lowStockProducts: lowStock,
      outOfStockProducts: outOfStock,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Perform manual Stock In / Stock Out / Adjustment
 */
router.post('/transaction', authenticateToken, hasPermission('inventory.manage'), async (req, res) => {
  try {
    const { productId, variantId, type, quantity, note } = req.body;

    if (!productId || !type || !quantity) {
      return res.status(400).json({ error: 'Product, transaction type and quantity are required' });
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive integer' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId } });
      if (!product) throw new Error('Product not found');

      let previousQty = product.stockQuantity;
      let newQty = previousQty;

      if (variantId) {
        const variant = await tx.productVariant.findUnique({ where: { id: variantId } });
        if (!variant) throw new Error('Variant not found');
        previousQty = variant.stockQuantity;

        if (type === 'STOCK_IN' || type === 'RETURN') {
          newQty = previousQty + qty;
        } else if (type === 'STOCK_OUT' || type === 'SALE' || type === 'DAMAGE') {
          if (previousQty < qty) throw new Error(`Insufficient variant stock (${previousQty} available)`);
          newQty = previousQty - qty;
        } else if (type === 'ADJUSTMENT') {
          newQty = qty;
        }

        await tx.productVariant.update({
          where: { id: variantId },
          data: { stockQuantity: newQty }
        });
      } else {
        if (type === 'STOCK_IN' || type === 'RETURN') {
          newQty = previousQty + qty;
        } else if (type === 'STOCK_OUT' || type === 'SALE' || type === 'DAMAGE') {
          if (previousQty < qty) throw new Error(`Insufficient product stock (${previousQty} available)`);
          newQty = previousQty - qty;
        } else if (type === 'ADJUSTMENT') {
          newQty = qty;
        }

        await tx.product.update({
          where: { id: productId },
          data: { stockQuantity: newQty }
        });
      }

      // Create Transaction History Record
      const invTrans = await tx.inventoryTransaction.create({
        data: {
          productId,
          variantId: variantId || null,
          type,
          quantity: qty,
          previousQty,
          newQty,
          userId: req.user.id,
          note: note || `${type} action by ${req.user.fullName}`,
        },
        include: {
          product: true,
          variant: true,
          user: true,
        }
      });

      // If Customer Return, update overall finance by recording refund
      if (type === 'RETURN') {
        const { customerId, customerName, refundAmount } = req.body;
        const refundVal = parseFloat(refundAmount) || (product.salePrice * qty) || (product.regularPrice * qty);
        const refundNumber = `RET-${Date.now().toString().slice(-6)}`;

        try {
          await tx.sale.create({
            data: {
              saleNumber: refundNumber,
              totalAmount: -Math.abs(refundVal),
              paymentMethod: 'CASH',
              customerId: customerId || null,
              customerName: customerName || 'Customer Return',
              sellerId: req.user.id,
              notes: `Refund for customer return: ${product.name} (Qty: ${qty}). ${note || ''}`,
              items: {
                create: [{
                  productId,
                  variantId: variantId || null,
                  quantity: qty,
                  unitPrice: -(Math.abs(refundVal) / qty),
                  totalPrice: -Math.abs(refundVal),
                }]
              }
            }
          });
        } catch (rfErr) {
          console.warn('Finance return adjustment notice:', rfErr.message);
        }
      }

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: `INVENTORY_${type}`,
          entity: 'Product',
          entityId: productId,
          metadata: JSON.stringify({ previousQty, newQty, change: qty }),
        }
      });

      return invTrans;
    });

    return res.json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * Get stock transaction audit history
 */
router.get('/transactions', authenticateToken, hasPermission('inventory.view'), async (req, res) => {
  try {
    const { productId, type, limit = 50 } = req.query;
    const where = {};
    if (productId) where.productId = productId;
    if (type) where.type = type;

    const transactions = await prisma.inventoryTransaction.findMany({
      where,
      include: {
        product: true,
        variant: true,
        user: { select: { id: true, fullName: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit, 10),
    });

    return res.json({ transactions });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
