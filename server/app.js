import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Routes
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import rolesRoutes from './routes/roles.js';
import departmentsRoutes from './routes/departments.js';
import divisionsRoutes from './routes/divisions.js';
import categoriesRoutes from './routes/categories.js';
import productsRoutes from './routes/products.js';
import servicesRoutes from './routes/services.js';
import inventoryRoutes from './routes/inventory.js';
import salesRoutes from './routes/sales.js';
import eventsRoutes from './routes/events.js';
import tasksRoutes from './routes/tasks.js';
import announcementsRoutes from './routes/announcements.js';
import messagesRoutes from './routes/messages.js';
import notificationsRoutes from './routes/notifications.js';
import analyticsRoutes from './routes/analytics.js';
import financeRoutes from './routes/finance.js';
import auditLogsRoutes from './routes/auditLogs.js';
import settingsRoutes from './routes/settings.js';
import uploadRoutes from './routes/upload.js';
import customersRoutes from './routes/customers.js';
import prisma from './database/prisma.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/divisions', divisionsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/audit-log', auditLogsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);

// Health check & Database Diagnostic endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    company: 'Romantic T Solutions Ltd',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/db-diagnostics', async (req, res) => {
  const dbUrl = (process.env.DATABASE_URL || '').trim();
  const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
  console.log('🔍 [DB Diagnostics] Checking database connection with URL:', maskedUrl);

  if (!dbUrl) {
    console.error('❌ [DB Diagnostics] DATABASE_URL is missing in environment variables.');
    return res.status(500).json({
      status: 'error',
      message: 'DATABASE_URL environment variable is missing on Vercel.',
      hint: 'Add DATABASE_URL in Vercel Project Settings -> Environment Variables.'
    });
  }

  const isLocalhost = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
  const isMysql = dbUrl.startsWith('mysql:') || dbUrl.startsWith('mysql://');

  try {
    const start = Date.now();
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timed out after 6 seconds. The database host did not respond.')), 6000))
    ]);
    const duration = Date.now() - start;
    console.log(`✅ [DB Diagnostics] Successfully connected to database in ${duration}ms!`);
    return res.json({
      status: 'connected',
      databaseUrl: maskedUrl,
      responseTime: `${duration}ms`,
      message: 'Database connection is healthy and working!'
    });
  } catch (err) {
    console.error('❌ [DB Diagnostics] Connection error:', err.message, 'Code:', err.code);
    return res.status(500).json({
      status: 'failed',
      databaseUrl: maskedUrl,
      error: err.message,
      code: err.code || 'TIMEOUT_OR_UNREACHABLE',
      diagnostics: {
        isLocalhost,
        hint: isLocalhost
          ? 'CRITICAL ERROR: DATABASE_URL is set to localhost / 127.0.0.1. In Vercel serverless functions, localhost does NOT exist. You must use your public cPanel domain or server IP address.'
          : (isMysql
              ? 'If using cPanel MySQL: 1) Go to your cPanel dashboard -> Databases -> "Remote MySQL". 2) Add "%" (wildcard) under "Add Access Host" so Vercel can connect. 3) Make sure port 3306 is open and your hosting provider allows external MySQL connections.'
              : 'Verify your PostgreSQL connection string, credentials, and network access (e.g., Supabase / Neon).')
      }
    });
  }
});

export default app;
