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
  // Optimize MySQL connection timeout so serverless does not hang for 30s
  if (url.startsWith('mysql://') || url.startsWith('mysql:')) {
    if (!url.includes('connect_timeout=')) {
      const sep = url.includes('?') ? '&' : '?';
      url = `${url}${sep}connect_timeout=8`;
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

export default prisma;
