import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function autoMigrateDatabase() {
  try {
    console.log('🔄 Checking database initialization...');
    
    // Check if key table exists
    await prisma.businessDivision.findFirst();
    console.log('✅ Database tables already initialized.');
  } catch (err) {
    console.log('⚡ Initializing database tables automatically on first run...');
    try {
      execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
      console.log('✅ Database tables created successfully!');
    } catch (pushErr) {
      console.error('⚠️ Database auto-migration warning:', pushErr.message);
    }
  }
}
