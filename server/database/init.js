import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import prisma from './prisma.js';

async function ensureTablesExist() {
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('sqlite') && !process.env.DATABASE_URL.includes('.db')) {
    return; // PostgreSQL schema is handled safely by Prisma
  }
  const createTablesSQL = [
    `CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL UNIQUE,
      "passwordHash" TEXT,
      "fullName" TEXT NOT NULL,
      "phone" TEXT,
      "profileImage" TEXT,
      "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      "roleId" TEXT,
      "departmentId" TEXT,
      "businessDivisionId" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "OtpCode" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "expiresAt" DATETIME NOT NULL,
      "used" BOOLEAN NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "Role" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL UNIQUE,
      "description" TEXT,
      "isSystem" BOOLEAN NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "Permission" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "code" TEXT NOT NULL UNIQUE,
      "description" TEXT NOT NULL,
      "category" TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS "RolePermission" (
      "roleId" TEXT NOT NULL,
      "permissionId" TEXT NOT NULL,
      PRIMARY KEY ("roleId", "permissionId")
    );`,
    `CREATE TABLE IF NOT EXISTS "Department" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL UNIQUE,
      "description" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "BusinessDivision" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL UNIQUE,
      "slug" TEXT NOT NULL UNIQUE,
      "description" TEXT,
      "image" TEXT,
      "tag" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "Category" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "slug" TEXT NOT NULL,
      "type" TEXT NOT NULL DEFAULT 'PRODUCT',
      "businessDivisionId" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "Product" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "sku" TEXT NOT NULL UNIQUE,
      "description" TEXT NOT NULL,
      "businessDivisionId" TEXT NOT NULL,
      "categoryId" TEXT NOT NULL,
      "images" TEXT NOT NULL,
      "regularPrice" REAL NOT NULL DEFAULT 0,
      "salePrice" REAL NOT NULL DEFAULT 0,
      "discountPercentage" INTEGER NOT NULL DEFAULT 0,
      "stockQuantity" INTEGER NOT NULL DEFAULT 0,
      "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
      "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      "isFeatured" BOOLEAN NOT NULL DEFAULT 0,
      "isNewArrival" BOOLEAN NOT NULL DEFAULT 0,
      "isOnSale" BOOLEAN NOT NULL DEFAULT 0,
      "isPopular" BOOLEAN NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "ProductVariant" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "productId" TEXT NOT NULL,
      "size" TEXT,
      "color" TEXT,
      "sku" TEXT,
      "stockQuantity" INTEGER NOT NULL DEFAULT 0,
      "priceOverride" REAL
    );`,
    `CREATE TABLE IF NOT EXISTS "InventoryTransaction" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "productId" TEXT NOT NULL,
      "variantId" TEXT,
      "type" TEXT NOT NULL,
      "quantity" INTEGER NOT NULL,
      "previousQty" INTEGER NOT NULL,
      "newQty" INTEGER NOT NULL,
      "userId" TEXT NOT NULL,
      "note" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "Sale" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "saleNumber" TEXT NOT NULL UNIQUE,
      "totalAmount" REAL NOT NULL,
      "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
      "customerName" TEXT,
      "customerPhone" TEXT,
      "sellerId" TEXT NOT NULL,
      "notes" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "SaleItem" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "saleId" TEXT NOT NULL,
      "productId" TEXT NOT NULL,
      "variantId" TEXT,
      "quantity" INTEGER NOT NULL,
      "unitPrice" REAL NOT NULL,
      "totalPrice" REAL NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS "Service" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "businessDivisionId" TEXT NOT NULL,
      "categoryId" TEXT NOT NULL,
      "images" TEXT NOT NULL,
      "location" TEXT DEFAULT 'Kigali & nationwide',
      "startingPrice" REAL,
      "features" TEXT,
      "icon" TEXT,
      "isFeatured" BOOLEAN NOT NULL DEFAULT 0,
      "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "Event" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "clientName" TEXT NOT NULL,
      "clientPhone" TEXT NOT NULL,
      "eventType" TEXT NOT NULL,
      "venue" TEXT NOT NULL,
      "date" DATETIME NOT NULL,
      "startTime" TEXT,
      "endTime" TEXT,
      "description" TEXT,
      "status" TEXT NOT NULL DEFAULT 'PLANNING',
      "managerId" TEXT,
      "createdById" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "EventAssignment" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "eventId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "roleName" TEXT NOT NULL,
      "checkInTime" DATETIME,
      "checkOutTime" DATETIME,
      "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "Task" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "description" TEXT,
      "assignedUserId" TEXT,
      "assignedRoleId" TEXT,
      "eventId" TEXT,
      "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
      "dueTime" DATETIME,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "createdById" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "completedAt" DATETIME
    );`,
    `CREATE TABLE IF NOT EXISTS "Announcement" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "targetAudience" TEXT NOT NULL DEFAULT 'EVERYONE',
      "targetId" TEXT,
      "priority" TEXT NOT NULL DEFAULT 'NORMAL',
      "relatedEventId" TEXT,
      "conversationId" TEXT,
      "createdById" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "Conversation" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT,
      "type" TEXT NOT NULL DEFAULT 'DIRECT',
      "relatedEntityId" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "ConversationMember" (
      "conversationId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "lastReadAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY ("conversationId", "userId")
    );`,
    `CREATE TABLE IF NOT EXISTS "Message" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "conversationId" TEXT NOT NULL,
      "senderId" TEXT NOT NULL,
      "text" TEXT NOT NULL,
      "attachments" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "MessageRead" (
      "messageId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "readAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY ("messageId", "userId")
    );`,
    `CREATE TABLE IF NOT EXISTS "Notification" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "relatedEntityId" TEXT,
      "entityType" TEXT,
      "isRead" BOOLEAN NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "AuditLog" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT,
      "action" TEXT NOT NULL,
      "entity" TEXT NOT NULL,
      "entityId" TEXT,
      "metadata" TEXT,
      "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "Setting" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "key" TEXT NOT NULL UNIQUE,
      "value" TEXT NOT NULL,
      "description" TEXT,
      "category" TEXT NOT NULL DEFAULT 'GENERAL',
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
  ];

  for (const sql of createTablesSQL) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch {
      // DDL safe ignore
    }
  }
}

export async function autoMigrateDatabase() {
  await ensureTablesExist();

  // Always ensure all essential system roles and brand settings exist
  try {
    const rolesToSeed = [
      { name: 'Super Administrator', description: 'Complete executive control and platform administration', isSystem: true },
      { name: 'Administrator', description: 'Full business operations, editing, and staff management', isSystem: true },
      { name: 'Operations Manager', description: 'Supervises stock, event command center, and workforce', isSystem: false },
      { name: 'Sales Manager', description: 'Oversees sales, point of sale terminals, and customer accounts', isSystem: false },
      { name: 'Sales Staff', description: 'Point of sale cashier, record transactions, and retail sales', isSystem: false },
      { name: 'Inventory Officer', description: 'Warehouse stock in/out, audits, and supplier tracking', isSystem: false },
      { name: 'Event Coordinator', description: 'Manages wedding events, equipment, and crew duties', isSystem: false },
      { name: 'Finance Officer', description: 'Monitors revenues, cash flow, refunds, and financial ledgers', isSystem: false },
      { name: 'Customer Support', description: 'Handles client communications, chat, and service inquiries', isSystem: false },
      { name: 'Regular User', description: 'Standard platform client and customer', isSystem: false },
    ];

    for (const r of rolesToSeed) {
      await prisma.role.upsert({
        where: { name: r.name },
        update: { description: r.description },
        create: r,
      }).catch(() => {});
    }

    const superAdminRole = await prisma.role.findUnique({ where: { name: 'Super Administrator' } });
    const regularRole = await prisma.role.findUnique({ where: { name: 'Regular User' } });

    // Fix: Reassign any non-primary user that was assigned Super Admin by fallback during self-registration
    if (superAdminRole && regularRole) {
      await prisma.user.updateMany({
        where: {
          email: { not: 'admin@romantictsolutions.com' },
          roleId: superAdminRole.id,
        },
        data: {
          roleId: regularRole.id,
        },
      }).catch(() => {});
    }

    // Ensure default brand colors exist in Setting
    await prisma.setting.upsert({
      where: { key: 'brand_primary_red' },
      update: {},
      create: { key: 'brand_primary_red', value: '#6a0203', category: 'BRANDING' },
    }).catch(() => {});

    await prisma.setting.upsert({
      where: { key: 'brand_primary_yellow' },
      update: {},
      create: { key: 'brand_primary_yellow', value: '#F5B700', category: 'BRANDING' },
    }).catch(() => {});

    // Ensure all popular categories exist across divisions
    const divRecords = await prisma.businessDivision.findMany();
    const divMap = {};
    for (const d of divRecords) divMap[d.name] = d.id;

    const allKnownCategories = [
      // Food & Beverages
      { name: 'Beverages & Soft Drinks', slug: 'beverages-soft-drinks', type: 'PRODUCT', div: 'Food & Beverages' },
      { name: 'Fresh Juices & Smoothies', slug: 'fresh-juices-smoothies', type: 'PRODUCT', div: 'Food & Beverages' },
      { name: 'Wines & Alcoholic Drinks', slug: 'wines-alcoholic-drinks', type: 'PRODUCT', div: 'Food & Beverages' },
      { name: 'Bakery & Fresh Pastries', slug: 'bakery-fresh-pastries', type: 'PRODUCT', div: 'Food & Beverages' },
      { name: 'Wholesale Rice & Grains', slug: 'wholesale-rice-grains', type: 'PRODUCT', div: 'Food & Beverages' },
      { name: 'Meat, Poultry & Seafood', slug: 'meat-poultry-seafood', type: 'PRODUCT', div: 'Food & Beverages' },
      { name: 'Dairy & Farm Products', slug: 'dairy-farm-products', type: 'PRODUCT', div: 'Food & Beverages' },
      { name: 'Snacks & Fast Bites', slug: 'snacks-fast-bites', type: 'PRODUCT', div: 'Food & Beverages' },
      { name: 'Mineral Water & Energy Drinks', slug: 'mineral-water-energy-drinks', type: 'PRODUCT', div: 'Food & Beverages' },
      { name: 'Event Catering Food Packs', slug: 'event-catering-food-packs', type: 'PRODUCT', div: 'Food & Beverages' },

      // Clothes & Shoes
      { name: "Men's Shoes & Sneakers", slug: 'mens-shoes-sneakers', type: 'PRODUCT', div: 'Clothes & Shoes' },
      { name: "Women's Shoes & Heels", slug: 'womens-shoes-heels', type: 'PRODUCT', div: 'Clothes & Shoes' },
      { name: "Men's Suits & Formal Wear", slug: 'mens-suits-formal-wear', type: 'PRODUCT', div: 'Clothes & Shoes' },
      { name: "Men's Casual & T-Shirts", slug: 'mens-casual-tshirts', type: 'PRODUCT', div: 'Clothes & Shoes' },
      { name: "Women's Dresses & Gowns", slug: 'womens-dresses-gowns', type: 'PRODUCT', div: 'Clothes & Shoes' },
      { name: 'Traditional Rwandan Attire (Mushanana)', slug: 'traditional-rwandan-mushanana', type: 'PRODUCT', div: 'Clothes & Shoes' },
      { name: "Children & Kids Clothing", slug: 'children-kids-clothing', type: 'PRODUCT', div: 'Clothes & Shoes' },
      { name: 'Handbags & Accessories', slug: 'handbags-accessories', type: 'PRODUCT', div: 'Clothes & Shoes' },
      { name: 'Sportswear & Activewear', slug: 'sportswear-activewear', type: 'PRODUCT', div: 'Clothes & Shoes' },
      { name: 'Jackets & Outerwear', slug: 'jackets-outerwear', type: 'PRODUCT', div: 'Clothes & Shoes' },

      // Wedding Services
      { name: 'Photography & Photo Albums', slug: 'photography-photo-albums', type: 'SERVICE', div: 'Wedding Services' },
      { name: 'Cinematic Videography & Drones', slug: 'cinematic-videography-drones', type: 'SERVICE', div: 'Wedding Services' },
      { name: 'Venue Decoration & Floral Styling', slug: 'venue-decoration-floral-styling', type: 'SERVICE', div: 'Wedding Services' },
      { name: 'Bridal VIP Cars & Limousines', slug: 'bridal-vip-cars-limos', type: 'SERVICE', div: 'Wedding Services' },
      { name: 'Master of Ceremony (MC) & DJ', slug: 'mc-sound-dj', type: 'SERVICE', div: 'Wedding Services' },
      { name: 'Sound Systems & Stage Lighting', slug: 'sound-systems-lighting', type: 'SERVICE', div: 'Wedding Services' },
      { name: 'Full Catering & Buffet Service', slug: 'catering-buffet-service', type: 'SERVICE', div: 'Wedding Services' },
      { name: 'Traditional Protocol & Dowry (Gusaba)', slug: 'traditional-protocol-gusaba', type: 'SERVICE', div: 'Wedding Services' },
      { name: 'Wedding Cakes & Champagne', slug: 'wedding-cakes-champagne', type: 'SERVICE', div: 'Wedding Services' },
      { name: 'Bridal Hair & Makeup Styling', slug: 'bridal-hair-makeup', type: 'SERVICE', div: 'Wedding Services' },

      // Consultancy Services
      { name: 'Business Strategy & Planning', slug: 'business-strategy-planning', type: 'SERVICE', div: 'Consultancy Services' },
      { name: 'Corporate Event Planning', slug: 'corporate-event-planning', type: 'SERVICE', div: 'Consultancy Services' },
      { name: 'Financial Advisory & Tax', slug: 'financial-advisory-tax', type: 'SERVICE', div: 'Consultancy Services' },
      { name: 'Digital Marketing & Branding', slug: 'digital-marketing-branding', type: 'SERVICE', div: 'Consultancy Services' },
      { name: 'Corporate Training & Workshops', slug: 'corporate-training-workshops', type: 'SERVICE', div: 'Consultancy Services' },
    ];

    for (const cat of allKnownCategories) {
      const divId = divMap[cat.div];
      if (divId) {
        await prisma.category.upsert({
          where: { slug_businessDivisionId: { slug: cat.slug, businessDivisionId: divId } },
          update: { name: cat.name, type: cat.type },
          create: { name: cat.name, slug: cat.slug, type: cat.type, businessDivisionId: divId },
        }).catch(() => {});
      }
    }
  } catch (roleErr) {
    console.warn('Role setup notice in autoMigrateDatabase:', roleErr.message);
  }

  try {
    // Check if tables and divisions exist
    const count = await prisma.businessDivision.count();
    if (count > 0) {
      console.log('✅ Database already initialized with business divisions.');
      return;
    }
  } catch (err) {
    console.log('⚡ Initializing database schema & tables...');
  }

  // Seed essential data programmatically without needing external binaries
  try {
    console.log('🌱 Seeding database programmatically...');

    // 1. Business Divisions
    const divData = [
      { name: 'Food & Beverages', slug: 'food-beverages', description: 'Drinks, food supplies, wholesale and retail', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=70', tag: 'FRESH' },
      { name: 'Clothes & Shoes', slug: 'clothes-shoes', description: 'Men, women and children fashion apparel', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=70', tag: 'NEW' },
      { name: 'Wedding Services', slug: 'wedding-services', description: 'Photography, videography, catering, decor & cars', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=70', tag: 'POPULAR' },
      { name: 'Consultancy Services', slug: 'consultancy-services', description: 'Business strategy, event planning & training advice', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=70', tag: 'EXPERT' },
    ];

    const divisions = {};
    for (const d of divData) {
      divisions[d.name] = await prisma.businessDivision.upsert({
        where: { name: d.name },
        update: d,
        create: d,
      });
    }

    // 2. Categories
    const catData = [
      { name: 'Beverages', slug: 'beverages', type: 'PRODUCT', div: 'Food & Beverages' },
      { name: 'Food supplies', slug: 'food-supplies', type: 'PRODUCT', div: 'Food & Beverages' },
      { name: 'Drinks', slug: 'drinks', type: 'PRODUCT', div: 'Food & Beverages' },
      { name: "Men's shoes", slug: 'mens-shoes', type: 'PRODUCT', div: 'Clothes & Shoes' },
      { name: "Women's clothes", slug: 'womens-clothes', type: 'PRODUCT', div: 'Clothes & Shoes' },
      { name: "Men's clothes", slug: 'mens-clothes', type: 'PRODUCT', div: 'Clothes & Shoes' },
      { name: 'Accessories', slug: 'accessories', type: 'PRODUCT', div: 'Clothes & Shoes' },
      { name: 'Photography', slug: 'photography', type: 'SERVICE', div: 'Wedding Services' },
      { name: 'Videography', slug: 'videography', type: 'SERVICE', div: 'Wedding Services' },
      { name: 'Decoration', slug: 'decoration', type: 'SERVICE', div: 'Wedding Services' },
      { name: 'Catering', slug: 'catering', type: 'SERVICE', div: 'Wedding Services' },
      { name: 'Cars & MC', slug: 'cars-mc', type: 'SERVICE', div: 'Wedding Services' },
      { name: 'Business', slug: 'business-consultancy', type: 'SERVICE', div: 'Consultancy Services' },
      { name: 'Events', slug: 'event-consultancy', type: 'SERVICE', div: 'Consultancy Services' },
    ];

    const categories = {};
    for (const c of catData) {
      const div = divisions[c.div];
      if (div) {
        categories[c.name] = await prisma.category.upsert({
          where: { slug_businessDivisionId: { slug: c.slug, businessDivisionId: div.id } },
          update: { name: c.name, type: c.type },
          create: { name: c.name, slug: c.slug, type: c.type, businessDivisionId: div.id },
        });
      }
    }

    // 3. Super Admin Role & User
    const role = await prisma.role.upsert({
      where: { name: 'Super Administrator' },
      update: {},
      create: { name: 'Super Administrator', description: 'Super Admin', isSystem: true },
    });

    const dept = await prisma.department.upsert({
      where: { name: 'Administration' },
      update: {},
      create: { name: 'Administration', description: 'Administration' },
    });

    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.user.upsert({
      where: { email: 'admin@romantictsolutions.com' },
      update: { passwordHash, roleId: role.id, departmentId: dept.id },
      create: {
        email: 'admin@romantictsolutions.com',
        passwordHash,
        fullName: 'Romantic Super Admin',
        phone: '250786639945',
        roleId: role.id,
        departmentId: dept.id,
        status: 'ACTIVE',
      },
    });

    // 4. Products (Food & Beverages, Clothes & Shoes)
    const sampleProducts = [
      {
        name: 'Premium Fruit Juice Pack (12)',
        sku: 'FB-JUICE-12P',
        description: 'Refreshing natural fruit juices, ideal for homes, offices and events.',
        div: 'Food & Beverages',
        cat: 'Beverages',
        images: JSON.stringify(['https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=70']),
        regularPrice: 18000,
        salePrice: 14400,
        discountPercentage: 20,
        stockQuantity: 40,
        isFeatured: true,
        isOnSale: true,
      },
      {
        name: 'Wholesale Rice 25kg',
        sku: 'FB-RICE-25KG',
        description: 'Quality long-grain rice supplied in bulk for retail and catering.',
        div: 'Food & Beverages',
        cat: 'Food supplies',
        images: JSON.stringify(['https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=70']),
        regularPrice: 38000,
        salePrice: 38000,
        discountPercentage: 0,
        stockQuantity: 15,
        isPopular: true,
      },
      {
        name: 'Assorted Soft Drinks Crate',
        sku: 'FB-DRINKS-CRATE',
        description: 'Cold-ready crate of assorted soft drinks for parties and shops.',
        div: 'Food & Beverages',
        cat: 'Drinks',
        images: JSON.stringify(['https://images.unsplash.com/photo-1581636625402-29b2a704ef4c?auto=format&fit=crop&w=800&q=70']),
        regularPrice: 12000,
        salePrice: 10000,
        discountPercentage: 17,
        stockQuantity: 60,
        isNewArrival: true,
        isOnSale: true,
      },
      {
        name: 'Classic Red Sneakers',
        sku: 'CS-RED-SNEAK',
        description: 'Comfortable everyday sneakers with durable soles.',
        div: 'Clothes & Shoes',
        cat: "Men's shoes",
        images: JSON.stringify(['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=70']),
        regularPrice: 50000,
        salePrice: 35000,
        discountPercentage: 30,
        stockQuantity: 25,
        isFeatured: true,
        isOnSale: true,
        isPopular: true,
      },
      {
        name: 'Elegant Summer Dress',
        sku: 'CS-DRESS-SUMMER',
        description: 'Light, stylish dress for events and daily wear.',
        div: 'Clothes & Shoes',
        cat: "Women's clothes",
        images: JSON.stringify(['https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=70']),
        regularPrice: 45000,
        salePrice: 32000,
        discountPercentage: 29,
        stockQuantity: 18,
        isNewArrival: true,
        isOnSale: true,
      },
      {
        name: 'Black Cotton T-Shirt',
        sku: 'CS-TSHIRT-BLK',
        description: 'Soft premium cotton T-shirt in multiple sizes.',
        div: 'Clothes & Shoes',
        cat: "Men's clothes",
        images: JSON.stringify(['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=70']),
        regularPrice: 12000,
        salePrice: 12000,
        discountPercentage: 0,
        stockQuantity: 30,
        isNewArrival: true,
        isPopular: true,
      },
    ];

    for (const p of sampleProducts) {
      const div = divisions[p.div];
      const cat = categories[p.cat];
      if (div && cat) {
        const { div: _, cat: __, ...pData } = p;
        await prisma.product.upsert({
          where: { sku: p.sku },
          update: { ...pData, businessDivisionId: div.id, categoryId: cat.id },
          create: { ...pData, businessDivisionId: div.id, categoryId: cat.id },
        });
      }
    }

    // 5. Services (Wedding & Consultancy)
    const sampleServices = [
      {
        name: 'Wedding Photography',
        description: 'Professional photographers capturing every precious moment of your big day.',
        div: 'Wedding Services',
        cat: 'Photography',
        images: JSON.stringify(['https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=70']),
        location: 'Kigali & nationwide',
        startingPrice: 150000,
        features: JSON.stringify(['Full-day coverage', 'Edited photos', 'Digital album']),
        isFeatured: true,
      },
      {
        name: 'Wedding Videography',
        description: 'Cinematic wedding films with 4K drone shots and highlight reels.',
        div: 'Wedding Services',
        cat: 'Videography',
        images: JSON.stringify(['https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=70']),
        location: 'Kigali & nationwide',
        startingPrice: 200000,
        features: JSON.stringify(['4K video', 'Drone shots', 'Highlight reel']),
        isFeatured: true,
      },
      {
        name: 'Business Consultancy',
        description: 'Strategy, market analysis and business growth advice for SMEs.',
        div: 'Consultancy Services',
        cat: 'Business',
        images: JSON.stringify(['https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=70']),
        location: 'Kigali / Online',
        startingPrice: null,
        icon: '📈',
        features: JSON.stringify(['Business plans', 'Market research', 'Growth strategy']),
        isFeatured: true,
      },
      {
        name: 'Event Planning Consultancy',
        description: 'End-to-end event conceptualization, budgeting and vendor coordination.',
        div: 'Consultancy Services',
        cat: 'Events',
        images: JSON.stringify(['https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=70']),
        location: 'Kigali & nationwide',
        startingPrice: null,
        icon: '🎯',
        features: JSON.stringify(['Event concept', 'Budgeting', 'Vendor coordination']),
        isFeatured: true,
      },
    ];

    for (const s of sampleServices) {
      const div = divisions[s.div];
      const cat = categories[s.cat];
      if (div && cat) {
        const { div: _, cat: __, ...sData } = s;
        const existing = await prisma.service.findFirst({ where: { name: s.name, businessDivisionId: div.id } });
        if (!existing) {
          await prisma.service.create({
            data: { ...sData, businessDivisionId: div.id, categoryId: cat.id }
          });
        }
      }
    }

    console.log('✅ Automatic seeding completed successfully.');
  } catch (err) {
    console.error('Programmatic seed error:', err.message);
  }
}
