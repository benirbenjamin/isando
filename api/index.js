import app from '../server/app.js';
import { autoMigrateDatabase } from '../server/database/init.js';

let isMigrated = false;

export default function handler(req, res) {
  return new Promise((resolve) => {
    const execute = async () => {
      try {
        if (!isMigrated) {
          isMigrated = true;
          await autoMigrateDatabase().catch(err => {
            console.warn('Auto migration notice:', err?.message || err);
          });
        }
      } catch (err) {
        console.warn('Migration pre-check notice:', err?.message || err);
      }

      // Ensure serverless lambda container waits until Express response is fully written
      res.on('finish', () => resolve());
      res.on('close', () => resolve());

      app(req, res);
    };

    execute().catch(err => {
      console.error('Serverless function error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: err?.message || 'Server error' });
      }
      resolve();
    });
  });
}
