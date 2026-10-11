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
  process.env.DATABASE_URL = url;
}

// Global singleton to prevent connection pool exhaustion in serverless environments
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

globalForPrisma.prisma = prisma;

export default prisma;
