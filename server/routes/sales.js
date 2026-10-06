import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, hasPermission } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Record a new sale (with atomic DB transaction & stock update)
 */
router.post('/', authenticateToken, hasPermission('sales.create'), async (req, res) => {
  try {
    const { items, paymentMethod, customerName, customerPhone, notes } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'At least one sale item is required' });
    }

    const saleNumber = `SALE-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    const result = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const saleItemsToCreate = [];

      for (const item of items) {
        const { productId, variantId, quantity, unitPrice } = item;
        const qty = parseInt(quantity, 10);
        if (!productId || isNaN(qty) || qty <= 0) {
          throw new Error('Invalid product or quantity in sale items');
        }

        const product = await tx.product.findUnique({ where: { id: productId } });
        if (!product) throw new Error(`Product ${productId} not found`);

        const price = unitPrice !== undefined ? parseFloat(unitPrice) : product.salePrice;
        const lineTotal = price * qty;
        totalAmount += lineTotal;

        // Stock Check & Decrease
        if (variantId) {
          const variant = await tx.productVariant.findUnique({ where: { id: variantId } });
          if (!variant) throw new Error(`Variant ${variantId} not found`);
          if (variant.stockQuantity < qty) {
            throw new Error(`Insufficient stock for ${product.name} (${variant.size || ''} ${variant.color || ''}). Available: ${variant.stockQuantity}`);
          }

          const newVariantQty = variant.stockQuantity - qty;
          await tx.productVariant.update({
            where: { id: variantId },
            data: { stockQuantity: newVariantQty }
          });

          await tx.inventoryTransaction.create({
            data: {
              productId,
              variantId,
              type: 'SALE',
              quantity: qty,
              previousQty: variant.stockQuantity,
              newQty: newVariantQty,
              userId: req.user.id,
              note: `Sale ${saleNumber}`,
            }
          });
        } else {
          if (product.stockQuantity < qty) {
            throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`);
          }

          const newProdQty = product.stockQuantity - qty;
          await tx.product.update({
            where: { id: productId },
            data: { stockQuantity: newProdQty }
          });

          await tx.inventoryTransaction.create({
            data: {
              productId,
              type: 'SALE',
              quantity: qty,
              previousQty: product.stockQuantity,
              newQty: newProdQty,
              userId: req.user.id,
              note: `Sale ${saleNumber}`,
            }
          });
        }

        saleItemsToCreate.push({
          productId,
          variantId: variantId || null,
          quantity: qty,
          unitPrice: price,
          totalPrice: lineTotal,
        });
      }

      // Auto-save or update Customer details if provided
      let customerRecord = null;
      if (customerName && customerName.trim()) {
        const cleanCustName = customerName.trim();
        const cleanCustPhone = customerPhone ? customerPhone.trim() : null;
        const cleanCustEmail = req.body.customerEmail ? req.body.customerEmail.trim() : null;
        const cleanCustAddr = req.body.customerAddress ? req.body.customerAddress.trim() : null;

        try {
          if (cleanCustPhone) {
            customerRecord = await tx.customer.findFirst({ where: { phone: cleanCustPhone } });
          }
          if (!customerRecord) {
            customerRecord = await tx.customer.findFirst({ where: { name: cleanCustName } });
          }

          if (customerRecord) {
            customerRecord = await tx.customer.update({
              where: { id: customerRecord.id },
              data: {
                name: cleanCustName,
                ...(cleanCustPhone && { phone: cleanCustPhone }),
                ...(cleanCustEmail && { email: cleanCustEmail }),
                ...(cleanCustAddr && { address: cleanCustAddr }),
              }
            });
          } else {
            customerRecord = await tx.customer.create({
              data: {
                name: cleanCustName,
                phone: cleanCustPhone,
                email: cleanCustEmail,
                address: cleanCustAddr,
              }
            });
          }
        } catch (cErr) {
          console.warn('Customer persistence notice:', cErr.message);
        }
      }

      // Create Sale Record
      const sale = await tx.sale.create({
        data: {
          saleNumber,
          totalAmount,
          paymentMethod: paymentMethod || 'CASH',
          customerId: customerRecord?.id || null,
          customerName: customerName || null,
          customerPhone: customerPhone || null,
          sellerId: req.user.id,
          notes: notes || null,
          items: {
            create: saleItemsToCreate,
          }
        },
        include: {
          items: {
            include: { product: true, variant: true }
          },
          seller: { select: { id: true, fullName: true, email: true } }
        }
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'SALE_RECORDED',
          entity: 'Sale',
          entityId: sale.id,
          metadata: JSON.stringify({ saleNumber, totalAmount }),
        }
      });

      return sale;
    });

    return res.status(201).json(result);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

/**
 * List sales
 */
router.get('/', authenticateToken, hasPermission('sales.view'), async (req, res) => {
  try {
    const { paymentMethod, sellerId, limit = 50, offset = 0 } = req.query;
    const where = {};
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (sellerId) where.sellerId = sellerId;

    const [total, sales] = await Promise.all([
      prisma.sale.count({ where }),
      prisma.sale.findMany({
        where,
        include: {
          items: { include: { product: true, variant: true } },
          seller: { select: { id: true, fullName: true, email: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit, 10),
        skip: parseInt(offset, 10),
      })
    ]);

    return res.json({ total, sales });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Single sale details
 */
router.get('/:id', authenticateToken, hasPermission('sales.view'), async (req, res) => {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { product: true, variant: true } },
        seller: { select: { id: true, fullName: true, email: true, phone: true } }
      }
    });

    if (!sale) return res.status(404).json({ error: 'Sale record not found' });
    return res.json(sale);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
