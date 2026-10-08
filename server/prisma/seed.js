import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for Romantic T Solutions Ltd...');

  // 1. Business Divisions
  const divisionsData = [
    { name: 'Food & Beverages', slug: 'food-beverages', description: 'Drinks, food supplies, wholesale and retail', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=70', tag: 'FRESH' },
    { name: 'Clothes & Shoes', slug: 'clothes-shoes', description: 'Men, women and children fashion apparel', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=70', tag: 'NEW' },
    { name: 'Wedding Services', slug: 'wedding-services', description: 'Photography, videography, catering, decoration, cars & MC', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=70', tag: 'POPULAR' },
    { name: 'Consultancy Services', slug: 'consultancy-services', description: 'Business strategy, event planning, procurement & training advice', image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=70', tag: 'EXPERT' },
  ];

  const divisions = {};
  for (const div of divisionsData) {
    divisions[div.name] = await prisma.businessDivision.upsert({
      where: { name: div.name },
      update: div,
      create: div,
    });
  }

  // 2. Categories
  const categoriesData = [
    { name: 'Beverages', slug: 'beverages', type: 'PRODUCT', division: 'Food & Beverages' },
    { name: 'Food supplies', slug: 'food-supplies', type: 'PRODUCT', division: 'Food & Beverages' },
    { name: 'Drinks', slug: 'drinks', type: 'PRODUCT', division: 'Food & Beverages' },
    { name: "Men's shoes", slug: 'mens-shoes', type: 'PRODUCT', division: 'Clothes & Shoes' },
    { name: "Women's clothes", slug: 'womens-clothes', type: 'PRODUCT', division: 'Clothes & Shoes' },
    { name: "Men's clothes", slug: 'mens-clothes', type: 'PRODUCT', division: 'Clothes & Shoes' },
    { name: 'Accessories', slug: 'accessories', type: 'PRODUCT', division: 'Clothes & Shoes' },
    { name: 'Photography', slug: 'photography', type: 'SERVICE', division: 'Wedding Services' },
    { name: 'Videography', slug: 'videography', type: 'SERVICE', division: 'Wedding Services' },
    { name: 'Decoration', slug: 'decoration', type: 'SERVICE', division: 'Wedding Services' },
    { name: 'Catering', slug: 'catering', type: 'SERVICE', division: 'Wedding Services' },
    { name: 'Cars & MC', slug: 'cars-mc', type: 'SERVICE', division: 'Wedding Services' },
    { name: 'Business', slug: 'business-consultancy', type: 'SERVICE', division: 'Consultancy Services' },
    { name: 'Events', slug: 'event-consultancy', type: 'SERVICE', division: 'Consultancy Services' },
    { name: 'Procurement', slug: 'procurement-advice', type: 'SERVICE', division: 'Consultancy Services' },
    { name: 'Training', slug: 'staff-training', type: 'SERVICE', division: 'Consultancy Services' },
  ];

  const categories = {};
  for (const cat of categoriesData) {
    const div = divisions[cat.division];
    categories[cat.name] = await prisma.category.upsert({
      where: { slug_businessDivisionId: { slug: cat.slug, businessDivisionId: div.id } },
      update: { name: cat.name, type: cat.type },
      create: {
        name: cat.name,
        slug: cat.slug,
        type: cat.type,
        businessDivisionId: div.id,
      },
    });
  }

  // 3. Departments
  const departmentsData = [
    { name: 'Administration', description: 'Company leadership & management' },
    { name: 'Food & Beverages', description: 'Kitchen, food production & beverage sales' },
    { name: 'Clothes & Shoes', description: 'Retail fashion & merchandise' },
    { name: 'Wedding Services', description: 'Event execution, media & coordination' },
    { name: 'Consultancy', description: 'Professional consulting & advisory' },
    { name: 'Sales', description: 'Customer sales & transactions' },
    { name: 'Inventory', description: 'Stock & warehouse management' },
  ];

  const departments = {};
  for (const dep of departmentsData) {
    departments[dep.name] = await prisma.department.upsert({
      where: { name: dep.name },
      update: dep,
      create: dep,
    });
  }

  // 4. Permissions
  const permissionsList = [
    { code: 'users.view', description: 'View user accounts', category: 'Users' },
    { code: 'users.create', description: 'Create new user accounts', category: 'Users' },
    { code: 'users.edit', description: 'Edit existing user accounts', category: 'Users' },
    { code: 'users.delete', description: 'Deactivate or delete users', category: 'Users' },
    { code: 'products.view', description: 'View products', category: 'Products' },
    { code: 'products.create', description: 'Create new products', category: 'Products' },
    { code: 'products.edit', description: 'Edit products and pricing', category: 'Products' },
    { code: 'products.delete', description: 'Delete products', category: 'Products' },
    { code: 'services.view', description: 'View services', category: 'Services' },
    { code: 'services.create', description: 'Create new services', category: 'Services' },
    { code: 'services.edit', description: 'Edit services', category: 'Services' },
    { code: 'services.delete', description: 'Delete services', category: 'Services' },
    { code: 'inventory.view', description: 'View inventory levels', category: 'Inventory' },
    { code: 'inventory.manage', description: 'Perform stock in/out and adjustments', category: 'Inventory' },
    { code: 'sales.view', description: 'View sales transactions', category: 'Sales' },
    { code: 'sales.create', description: 'Record new sales', category: 'Sales' },
    { code: 'events.view', description: 'View events', category: 'Events' },
    { code: 'events.create', description: 'Create new events', category: 'Events' },
    { code: 'events.manage', description: 'Manage event assignments & command center', category: 'Events' },
    { code: 'tasks.view', description: 'View tasks', category: 'Tasks' },
    { code: 'tasks.create', description: 'Create tasks', category: 'Tasks' },
    { code: 'tasks.manage', description: 'Manage and reassign tasks', category: 'Tasks' },
    { code: 'announcements.create', description: 'Create and publish announcements', category: 'Announcements' },
    { code: 'announcements.manage', description: 'Manage announcements', category: 'Announcements' },
    { code: 'messages.view', description: 'View internal messages', category: 'Messages' },
    { code: 'messages.send', description: 'Send internal messages', category: 'Messages' },
    { code: 'reports.view', description: 'View business reports & analytics', category: 'Reports' },
    { code: 'finance.view', description: 'View financial breakdown & revenue', category: 'Finance' },
    { code: 'audit.view', description: 'View system audit logs', category: 'Audit' },
    { code: 'settings.manage', description: 'Manage company & system settings', category: 'Settings' },
  ];

  const dbPermissions = [];
  for (const perm of permissionsList) {
    const createdPerm = await prisma.permission.upsert({
      where: { code: perm.code },
      update: perm,
      create: perm,
    });
    dbPermissions.push(createdPerm);
  }

  // 5. Roles
  const rolesData = [
    { name: 'Super Administrator', description: 'Full system access & control', isSystem: true },
    { name: 'Administrator', description: 'Business & platform admin', isSystem: true },
    { name: 'Manager', description: 'Operations & team manager', isSystem: false },
    { name: 'Event Manager', description: 'Wedding & event command center manager', isSystem: false },
    { name: 'Stock Manager', description: 'Inventory & product manager', isSystem: false },
    { name: 'Sales Staff', description: 'Sales execution staff', isSystem: false },
    { name: 'Photographer', description: 'Media photography specialist', isSystem: false },
    { name: 'Videographer', description: 'Media videography specialist', isSystem: false },
    { name: 'Kitchen Chef', description: 'Catering kitchen team', isSystem: false },
    { name: 'Driver', description: 'Event logistics & transport', isSystem: false },
    { name: 'MC', description: 'Ceremony Host & MC', isSystem: false },
    { name: 'Consultant', description: 'Consultancy specialist', isSystem: false },
  ];

  const roles = {};
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: r,
    });
    roles[r.name] = role;

    // Attach all permissions to Super Administrator and Administrator
    if (r.name === 'Super Administrator' || r.name === 'Administrator') {
      for (const perm of dbPermissions) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
          update: {},
          create: { roleId: role.id, permissionId: perm.id },
        });
      }
    }
  }

  // Assign basic permissions to Stock Manager
  const stockPermCodes = ['inventory.view', 'inventory.manage', 'products.view', 'products.create', 'products.edit', 'sales.view', 'sales.create', 'messages.send', 'tasks.view'];
  for (const permCode of stockPermCodes) {
    const perm = dbPermissions.find(p => p.code === permCode);
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: roles['Stock Manager'].id, permissionId: perm.id } },
        update: {},
        create: { roleId: roles['Stock Manager'].id, permissionId: perm.id },
      });
    }
  }

  // 6. Super Admin Account
  const passwordHash = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'romantictsolutions@gmail.com' },
    update: {
      passwordHash,
      fullName: 'Romantic Super Admin',
      phone: '250786639945',
      roleId: roles['Super Administrator'].id,
      departmentId: departments['Administration'].id,
      status: 'ACTIVE',
    },
    create: {
      email: 'romantictsolutions@gmail.com',
      passwordHash,
      fullName: 'Romantic Super Admin',
      phone: '250786639945',
      roleId: roles['Super Administrator'].id,
      departmentId: departments['Administration'].id,
      status: 'ACTIVE',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@romantictsolutions.com' },
    update: {
      passwordHash,
      fullName: 'Romantic Super Admin',
      phone: '250786639945',
      roleId: roles['Super Administrator'].id,
      departmentId: departments['Administration'].id,
      status: 'ACTIVE',
    },
    create: {
      email: 'admin@romantictsolutions.com',
      passwordHash,
      fullName: 'Romantic Super Admin',
      phone: '250786639945',
      roleId: roles['Super Administrator'].id,
      departmentId: departments['Administration'].id,
      status: 'ACTIVE',
    },
  }).catch(() => {});

  // Seed sample workers
  const sampleWorkers = [
    { email: 'jean.photographer@romantictsolutions.com', name: 'Jean Paul (Photographer)', role: 'Photographer', dept: 'Wedding Services' },
    { email: 'eric.photographer@romantictsolutions.com', name: 'Eric Bizimana (Photographer)', role: 'Photographer', dept: 'Wedding Services' },
    { email: 'patrick.video@romantictsolutions.com', name: 'Patrick Mugisha (Videographer)', role: 'Videographer', dept: 'Wedding Services' },
    { email: 'pierre.chef@romantictsolutions.com', name: 'Chef Pierre (Head Chef)', role: 'Kitchen Chef', dept: 'Food & Beverages' },
    { email: 'claude.driver@romantictsolutions.com', name: 'Claude Nshimiyimana (Driver)', role: 'Driver', dept: 'Wedding Services' },
    { email: 'stock.manager@romantictsolutions.com', name: 'Stock Manager Alice', role: 'Stock Manager', dept: 'Inventory' },
  ];

  for (const w of sampleWorkers) {
    await prisma.user.upsert({
      where: { email: w.email },
      update: {
        passwordHash,
        fullName: w.name,
        roleId: roles[w.role].id,
        departmentId: departments[w.dept].id,
      },
      create: {
        email: w.email,
        passwordHash,
        fullName: w.name,
        roleId: roles[w.role].id,
        departmentId: departments[w.dept].id,
        status: 'ACTIVE',
      },
    });
  }

  // 7. Products
  const productsData = [
    {
      name: 'Premium Fruit Juice Pack (12)',
      sku: 'FB-JUICE-12P',
      description: 'Refreshing natural fruit juices, ideal for homes, offices and events.',
      division: 'Food & Beverages',
      category: 'Beverages',
      images: JSON.stringify(['https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=70']),
      regularPrice: 18000,
      salePrice: 14400,
      discountPercentage: 20,
      stockQuantity: 40,
      lowStockThreshold: 10,
      isFeatured: true,
      isOnSale: true,
    },
    {
      name: 'Wholesale Rice 25kg',
      sku: 'FB-RICE-25KG',
      description: 'Quality long-grain rice supplied in bulk for retail and catering.',
      division: 'Food & Beverages',
      category: 'Food supplies',
      images: JSON.stringify(['https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=70']),
      regularPrice: 38000,
      salePrice: 38000,
      discountPercentage: 0,
      stockQuantity: 3,
      lowStockThreshold: 5,
      isPopular: true,
    },
    {
      name: 'Assorted Soft Drinks Crate',
      sku: 'FB-DRINKS-CRATE',
      description: 'Cold-ready crate of assorted soft drinks for parties and shops.',
      division: 'Food & Beverages',
      category: 'Drinks',
      images: JSON.stringify(['https://images.unsplash.com/photo-1581636625402-29b2a704ef4c?auto=format&fit=crop&w=800&q=70']),
      regularPrice: 12000,
      salePrice: 10000,
      discountPercentage: 17,
      stockQuantity: 60,
      lowStockThreshold: 10,
      isNewArrival: true,
      isOnSale: true,
    },
    {
      name: 'Classic Red Sneakers',
      sku: 'CS-RED-SNEAK',
      description: 'Comfortable everyday sneakers with durable soles.',
      division: 'Clothes & Shoes',
      category: "Men's shoes",
      images: JSON.stringify(['https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=70']),
      regularPrice: 50000,
      salePrice: 35000,
      discountPercentage: 30,
      stockQuantity: 25,
      lowStockThreshold: 5,
      isFeatured: true,
      isOnSale: true,
      isPopular: true,
      variants: [
        { size: '38', color: 'Red', stockQuantity: 5 },
        { size: '40', color: 'Red', stockQuantity: 8 },
        { size: '42', color: 'Red', stockQuantity: 7 },
        { size: '44', color: 'Red', stockQuantity: 5 },
      ]
    },
    {
      name: 'Elegant Summer Dress',
      sku: 'CS-DRESS-SUMMER',
      description: 'Light, stylish dress for events and daily wear.',
      division: 'Clothes & Shoes',
      category: "Women's clothes",
      images: JSON.stringify(['https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=70']),
      regularPrice: 45000,
      salePrice: 32000,
      discountPercentage: 29,
      stockQuantity: 18,
      lowStockThreshold: 5,
      isNewArrival: true,
      isOnSale: true,
      variants: [
        { size: 'S', color: 'Yellow', stockQuantity: 4 },
        { size: 'M', color: 'Red', stockQuantity: 8 },
        { size: 'L', color: 'White', stockQuantity: 6 },
      ]
    },
    {
      name: 'Black Cotton T-Shirt',
      sku: 'CS-TSHIRT-BLK',
      description: 'Soft premium cotton T-shirt in multiple sizes.',
      division: 'Clothes & Shoes',
      category: "Men's clothes",
      images: JSON.stringify(['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=70']),
      regularPrice: 12000,
      salePrice: 12000,
      discountPercentage: 0,
      stockQuantity: 30,
      lowStockThreshold: 5,
      isNewArrival: true,
      isPopular: true,
      variants: [
        { size: 'S', color: 'Black', stockQuantity: 5 },
        { size: 'M', color: 'Black', stockQuantity: 12 },
        { size: 'L', color: 'Black', stockQuantity: 8 },
        { size: 'XL', color: 'Black', stockQuantity: 5 },
      ]
    },
  ];

  for (const p of productsData) {
    const div = divisions[p.division];
    const cat = categories[p.category];
    const { variants, division, category, ...prodFields } = p;

    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        ...prodFields,
        businessDivisionId: div.id,
        categoryId: cat.id,
      },
      create: {
        ...prodFields,
        businessDivisionId: div.id,
        categoryId: cat.id,
      },
    });

    if (variants && variants.length > 0) {
      for (const v of variants) {
        const vSku = `${p.sku}-${v.size}-${v.color}`;
        const existingVariant = await prisma.productVariant.findFirst({
          where: { productId: product.id, size: v.size, color: v.color }
        });

        if (!existingVariant) {
          await prisma.productVariant.create({
            data: {
              productId: product.id,
              size: v.size,
              color: v.color,
              sku: vSku,
              stockQuantity: v.stockQuantity,
            }
          });
        }
      }
    }
  }

  // 8. Services
  const servicesData = [
    {
      name: 'Wedding Photography',
      description: 'Professional photographers capturing every precious moment of your big day.',
      division: 'Wedding Services',
      category: 'Photography',
      images: JSON.stringify(['https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=70']),
      location: 'Kigali & nationwide',
      startingPrice: 150000,
      features: JSON.stringify(['Full-day coverage', 'High resolution edited photos', 'Custom digital album']),
      isFeatured: true,
    },
    {
      name: 'Wedding Videography',
      description: 'Cinematic wedding films with drone shots and highlight reels.',
      division: 'Wedding Services',
      category: 'Videography',
      images: JSON.stringify(['https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=800&q=70']),
      location: 'Kigali & nationwide',
      startingPrice: 200000,
      features: JSON.stringify(['4K Cinematic video', 'Drone aerial shots', 'Short social media highlight reel']),
      isFeatured: true,
    },
    {
      name: 'Wedding Decoration',
      description: 'Beautiful venue styling, floral design, lighting and stage decor.',
      division: 'Wedding Services',
      category: 'Decoration',
      images: JSON.stringify(['https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=800&q=70']),
      location: 'Kigali & nationwide',
      startingPrice: 300000,
      features: JSON.stringify(['Complete venue styling', 'Fresh flowers design', 'Ambient mood lighting']),
      isFeatured: true,
    },
    {
      name: 'Wedding Catering',
      description: 'Delicious buffet menus served by professional kitchen chefs and friendly waiters.',
      division: 'Wedding Services',
      category: 'Catering',
      images: JSON.stringify(['https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=800&q=70']),
      location: 'Kigali & nationwide',
      startingPrice: 500000,
      features: JSON.stringify(['Custom menu options', 'Professional chefs & waiters', 'Full tableware service']),
      isFeatured: false,
    },
    {
      name: 'Business Consultancy',
      description: 'Strategy, market analysis and business expansion advice for SMEs in Rwanda.',
      division: 'Consultancy Services',
      category: 'Business',
      images: JSON.stringify(['https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=70']),
      location: 'Kigali / Online',
      startingPrice: null,
      icon: '📈',
      features: JSON.stringify(['Business plan creation', 'Market research & feasibility', 'Growth & revenue strategy']),
      isFeatured: true,
    },
    {
      name: 'Event Planning Consultancy',
      description: 'End-to-end event conceptualization, budgeting and vendor coordination.',
      division: 'Consultancy Services',
      category: 'Events',
      images: JSON.stringify(['https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=70']),
      location: 'Kigali & nationwide',
      startingPrice: null,
      icon: '🎯',
      features: JSON.stringify(['Event concept design', 'Budget management', 'Vendor selection & management']),
      isFeatured: true,
    },
  ];

  for (const s of servicesData) {
    const div = divisions[s.division];
    const cat = categories[s.category];
    const { division, category, ...srvFields } = s;

    const existing = await prisma.service.findFirst({
      where: { name: s.name, businessDivisionId: div.id }
    });

    if (existing) {
      await prisma.service.update({
        where: { id: existing.id },
        data: { ...srvFields, businessDivisionId: div.id, categoryId: cat.id }
      });
    } else {
      await prisma.service.create({
        data: { ...srvFields, businessDivisionId: div.id, categoryId: cat.id }
      });
    }
  }

  // 9. Initial System Settings
  const settingsData = [
    { key: 'company_name', value: 'Romantic T Solutions Ltd', category: 'GENERAL', description: 'Official company name' },
    { key: 'whatsapp_number', value: '250786639945', category: 'GENERAL', description: 'Primary WhatsApp business contact' },
    { key: 'company_email', value: 'info@romantictsolutions.com', category: 'GENERAL', description: 'Contact email' },
    { key: 'company_address', value: 'Kigali, Rwanda', category: 'GENERAL', description: 'Physical location' },
    { key: 'currency_symbol', value: 'Frw', category: 'GENERAL', description: 'Default currency symbol' },
    { key: 'storage_provider', value: 'LOCAL', category: 'STORAGE', description: 'Active storage provider: LOCAL, VERCEL_BLOB, GOOGLE_DRIVE' },
    { key: 'google_drive_accounts', value: '[]', category: 'STORAGE', description: 'Configured Google Drive API accounts array' },
    { key: 'resend_api_key', value: '', category: 'EMAIL', description: 'Resend API key' },
    { key: 'smtp_host', value: '', category: 'EMAIL', description: 'SMTP fallback server host' },
    { key: 'smtp_port', value: '587', category: 'EMAIL', description: 'SMTP fallback server port' },
    { key: 'smtp_user', value: '', category: 'EMAIL', description: 'SMTP username' },
    { key: 'smtp_pass', value: '', category: 'EMAIL', description: 'SMTP password' },
  ];

  for (const set of settingsData) {
    await prisma.setting.upsert({
      where: { key: set.key },
      update: { value: set.value, description: set.description, category: set.category },
      create: set,
    });
  }

  console.log('✅ Database seeding complete for Romantic T Solutions Ltd!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
