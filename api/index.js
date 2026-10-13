import app from '../server/app.js';
import { autoMigrateDatabase } from '../server/database/init.js';

let migrationExecuted = false;
let migrationPromise = null;

export default async function handler(req, res) {
  if (!migrationExecuted) {
    if (!migrationPromise) {
      migrationPromise = (async () => {
        try {
          await Promise.race([
            autoMigrateDatabase(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('autoMigrateDatabase initialization timed out after 12s')), 12000))
          ]);
          migrationExecuted = true;
        } catch (err) {
          console.warn('⚠️ Vercel serverless migration notice:', err.message);
          // Allow subsequent requests to retry if this was an initial wake-up delay
          migrationPromise = null;
        }
      })();
    }

    // For public GET catalog requests, don't block indefinitely while migration runs
    const isPublicGet = req.method === 'GET' && (
      req.url?.startsWith('/api/products') ||
      req.url?.startsWith('/api/services') ||
      req.url?.startsWith('/api/divisions') ||
      req.url?.startsWith('/api/categories')
    );

    if (!isPublicGet) {
      await migrationPromise;
    } else {
      // Give migration a 2.5s window to connect/wake the database, then proceed
      await Promise.race([
        migrationPromise,
        new Promise(r => setTimeout(r, 2500))
      ]);
    }
  }

  return app(req, res);
}
