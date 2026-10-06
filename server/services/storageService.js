import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { put as vercelPut } from '@vercel/blob';
import { google } from 'googleapis';
import prisma from '../database/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME;
const UPLOADS_DIR = isVercel ? '/tmp/uploads' : path.join(__dirname, '../../uploads');
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
} catch {
  // Read-only filesystem safe
}

async function getSetting(key) {
  try {
    const s = await prisma.setting.findUnique({ where: { key } });
    return s ? s.value : process.env[key.toUpperCase()];
  } catch {
    return process.env[key.toUpperCase()];
  }
}

/**
 * Upload to local disk
 */
function uploadToLocal(fileBuffer, originalName) {
  const ext = path.extname(originalName) || '.jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
  const filePath = path.join(UPLOADS_DIR, fileName);
  fs.writeFileSync(filePath, fileBuffer);
  return `/uploads/${fileName}`;
}

/**
 * Upload to Vercel Blob Bucket
 */
async function uploadToVercelBlob(fileBuffer, originalName) {
  const token = process.env.BLOB_READ_WRITE_TOKEN || await getSetting('blob_read_write_token');
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN missing in environment or settings');
  }
  const blob = await vercelPut(`uploads/${Date.now()}-${originalName}`, fileBuffer, {
    access: 'public',
    token,
  });
  return blob.url;
}

/**
 * Upload to Google Drive account
 */
async function uploadToGoogleDriveAccount(fileBuffer, originalName, accountConfig) {
  const auth = new google.auth.OAuth2(
    accountConfig.clientId,
    accountConfig.clientSecret
  );
  auth.setCredentials({ refresh_token: accountConfig.refreshToken });

  const drive = google.drive({ version: 'v3', auth });
  
  // Quota check
  try {
    const about = await drive.about.get({ fields: 'storageQuota' });
    const quota = about.data.storageQuota;
    if (quota && quota.limit && quota.usage) {
      const limit = parseInt(quota.limit, 10);
      const usage = parseInt(quota.usage, 10);
      if (limit > 0 && usage >= limit * 0.98) {
        throw new Error(`Google Drive Account [${accountConfig.name}] quota full (${Math.round((usage/limit)*100)}% used)`);
      }
    }
  } catch (qErr) {
    console.warn(`Quota check skipped/failed for ${accountConfig.name}: ${qErr.message}`);
  }

  const { Readable } = await import('stream');
  const stream = new Readable();
  stream.push(fileBuffer);
  stream.push(null);

  const fileMetadata = {
    name: `${Date.now()}-${originalName}`,
    parents: accountConfig.folderId ? [accountConfig.folderId] : [],
  };
  const media = {
    mimeType: 'image/jpeg',
    body: stream,
  };

  const file = await drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id, webViewLink, webContentLink',
  });

  await drive.permissions.create({
    fileId: file.data.id,
    requestBody: { role: 'reader', type: 'anyone' },
  });

  return `https://lh3.googleusercontent.com/d/${file.data.id}`;
}

export async function uploadFile(fileBuffer, originalName, mimeType = 'image/jpeg') {
  const vercelToken = process.env.BLOB_READ_WRITE_TOKEN || await getSetting('blob_read_write_token');
  
  let googleAccountsRaw = await getSetting('google_drive_accounts');
  let googleAccounts = [];
  try {
    googleAccounts = JSON.parse(googleAccountsRaw || '[]');
  } catch {
    googleAccounts = [];
  }

  let vercelBlobUrl = null;
  let googleDriveUrl = null;

  // 1. Try Vercel Blob Bucket
  if (vercelToken) {
    try {
      console.log('🌐 Uploading to Vercel Cloud Blob Bucket...');
      vercelBlobUrl = await uploadToVercelBlob(fileBuffer, originalName);
      console.log('✅ Successfully uploaded to Vercel Blob Bucket:', vercelBlobUrl);
    } catch (err) {
      console.warn(`⚠️ Vercel Blob bucket upload failed: ${err.message}`);
    }
  }

  // 2. Try Google Drive (Failover or Secondary Mirror)
  if (googleAccounts.length > 0) {
    for (const acc of googleAccounts) {
      try {
        console.log(`🌐 Uploading to Google Drive Account: [${acc.name}]...`);
        googleDriveUrl = await uploadToGoogleDriveAccount(fileBuffer, originalName, acc);
        console.log(`✅ Successfully uploaded to Google Drive [${acc.name}]:`, googleDriveUrl);
        break; // Successfully uploaded to at least one Google Drive account
      } catch (err) {
        console.warn(`⚠️ Google Drive [${acc.name}] upload failed: ${err.message}`);
      }
    }
  }

  // Return cloud URLs with Drive failover if both exist
  if (vercelBlobUrl && googleDriveUrl) {
    return { url: vercelBlobUrl, backupUrl: googleDriveUrl };
  }
  if (vercelBlobUrl) return { url: vercelBlobUrl, backupUrl: null };
  if (googleDriveUrl) return { url: googleDriveUrl, backupUrl: null };

  // 3. Fallback: Direct Base64 Data URI so image is ALWAYS 100% visible and NEVER produces a 404 broken image
  console.log('🖼️ Cloud storage not configured yet: encoding as resilient direct Data URI so image is immediately visible everywhere...');
  const base64 = fileBuffer.toString('base64');
  const safeMime = mimeType || 'image/jpeg';
  return { url: `data:${safeMime};base64,${base64}`, backupUrl: null };
}
