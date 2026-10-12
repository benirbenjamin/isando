import app from '../server/app.js';
import { autoMigrateDatabase } from '../server/database/init.js';

let migrationExecuted = false;

export default async function handler(req, res) {
  if (!migrationExecuted) {
    migrationExecuted = true;
    try {
      await autoMigrateDatabase();
    } catch (err) {
      console.warn('Vercel serverless migration notice:', err.message);
    }
  }
  return app(req, res);
}
