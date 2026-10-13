import { PrismaClient } from '@prisma/client';

if (process.env.DATABASE_URL) {
  let url = process.env.DATABASE_URL;
  if (url.startsWith('postgres://')) {
    url = url.replace('postgres://', 'postgresql://');
  }
  // Ensure optimal PgBouncer connection pooler parameters in serverless environments
  if (url.includes('pooled.db.prisma.io') || url.includes('pgbouncer')) {
    const paramsToAdd = [];
    if (!url.includes('pgbouncer=true')) paramsToAdd.push('pgbouncer=true');
    if (!url.includes('connection_limit=')) paramsToAdd.push('connection_limit=1');
    if (!url.includes('sslmode=')) paramsToAdd.push('sslmode=require');
    if (paramsToAdd.length > 0) {
      const sep = url.includes('?') ? '&' : '?';
      url = `${url}${sep}${paramsToAdd.join('&')}`;
    }
  }
  // Optimize MySQL & Postgres connection timeout so sleeping databases have ample time to wake up
  if (url.startsWith('mysql://') || url.startsWith('mysql:')) {
    if (!url.includes('connect_timeout=')) {
      const sep = url.includes('?') ? '&' : '?';
      url = `${url}${sep}connect_timeout=15`;
    }
  } else if (url.startsWith('postgres://') || url.startsWith('postgresql://')) {
    if (!url.includes('connect_timeout=')) {
      const sep = url.includes('?') ? '&' : '?';
      url = `${url}${sep}connect_timeout=15`;
    }
  }

  process.env.DATABASE_URL = url;

  // Mask sensitive credentials when logging
  const masked = url.replace(/:([^:@]+)@/, ':****@');
  console.log(`🔌 Initializing Prisma with database URL: ${masked}`);
} else {
  console.warn('⚠️ No DATABASE_URL environment variable found!');
}

// Global singleton to prevent connection pool exhaustion in serverless environments
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['warn', 'error'],
  });

globalForPrisma.prisma = prisma;

/**
 * Executes a database operation with resilient retry logic.
 * Specifically handles sleeping databases, cold starts, connection pool timeouts,
 * and transient network packet loss.
 */
export async function withDbRetry(operation, options = {}) {
  const {
    maxRetries = 3,
    initialDelayMs = 1500,
    backoffMultiplier = 1.5,
    operationName = 'Database operation'
  } = options;

  let attempt = 0;
  let delay = initialDelayMs;

  while (true) {
    try {
      return await operation();
    } catch (err) {
      attempt++;
      const isTransientError =
        err.code === 'P1001' || // Can't reach database server
        err.code === 'P1002' || // Database server reached but timed out
        err.code === 'P1008' || // Operations timed out
        err.code === 'P1017' || // Server has closed connection
        err.code === 'P2024' || // Connection pool timeout
        err.name === 'PrismaClientInitializationError' ||
        err.name === 'PrismaClientRustPanicError' ||
        (err.message && (
          err.message.includes('Can\'t reach database server') ||
          err.message.includes('timed out') ||
          err.message.includes('ECONNREFUSED') ||
          err.message.includes('ETIMEDOUT') ||
          err.message.includes('ECONNRESET') ||
          err.message.includes('Connection lost') ||
          err.message.includes('PROTOCOL_CONNECTION_LOST') ||
          err.message.includes('Server has gone away') ||
          err.message.includes('deadlock')
        ));

      if (attempt <= maxRetries && isTransientError) {
        console.warn(`⏳ [DB Sleep/Wake-up] ${operationName} failed (attempt ${attempt}/${maxRetries}): ${err.message}. Retrying in ${delay}ms while database wakes up...`);
        // Attempt reconnect if Prisma connection dropped
        try {
          await prisma.$connect();
        } catch (_) {}
        await new Promise(r => setTimeout(r, delay));
        delay = Math.round(delay * backoffMultiplier);
      } else {
        throw err;
      }
    }
  }
}

/**
 * Health check to verify whether database is responsive
 */
export async function checkDbConnection(timeoutMs = 6000) {
  try {
    const isMysql = (process.env.DATABASE_URL || '').includes('mysql');
    await Promise.race([
      isMysql ? prisma.$queryRaw`SELECT 1` : prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection check timed out')), timeoutMs))
    ]);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export default prisma;

