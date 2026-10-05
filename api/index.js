import app from '../server/app.js';
import { autoMigrateDatabase } from '../server/database/init.js';

let isMigrated = false;

export default async function handler(req, res) {
  try {
    if (!isMigrated) {
      isMigrated = true;
      await autoMigrateDatabase().catch(err => {
        console.warn('Auto migration notice:', err?.message || err);
      });
    }
    return app(req, res);
  } catch (err) {
    console.error('Serverless function execution error:', err);
    return res.status(500).json({
      error: 'Server error: ' + (err.message || 'An internal server error occurred'),
    });
  }
}
