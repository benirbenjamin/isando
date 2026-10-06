import { PrismaClient } from '@prisma/client';

if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres://')) {
  process.env.DATABASE_URL = process.env.DATABASE_URL.replace('postgres://', 'postgresql://');
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
