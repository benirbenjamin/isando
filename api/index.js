import app from '../server/app.js';
import { autoMigrateDatabase } from '../server/database/init.js';

let isMigrated = false;

export default async function handler(req, res) {
  if (!isMigrated) {
    await autoMigrateDatabase().catch(err => console.warn('Auto migration error:', err));
    isMigrated = true;
  }
  return app(req, res);
}
