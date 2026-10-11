import app from '../server/app.js';
import { autoMigrateDatabase } from '../server/database/init.js';

let migrationExecuted = false;

export default async function handler(req, res) {
  if (!migrationExecuted) {
    migrationExecuted = true;
    const isRemotePostgres = process.env.DATABASE_URL && (process.env.DATABASE_URL.includes('postgresql') || process.env.DATABASE_URL.includes('prisma.io'));
    if (!isRemotePostgres) {
      try {
        await autoMigrateDatabase();
      } catch (err) {
        console.warn('Vercel serverless migration notice:', err.message);
      }
    }
  }
  return app(req, res);
}
