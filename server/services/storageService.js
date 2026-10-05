import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { put as vercelPut } from '@vercel/blob';
import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

const UPLOADS_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
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

  return `https://drive.google.com/uc?export=view&id=${file.data.id}`;
}

export async function uploadFile(fileBuffer, originalName, mimeType = 'image/jpeg') {
  const activeProvider = (await getSetting('storage_provider')) || 'AUTO';
  const vercelToken = process.env.BLOB_READ_WRITE_TOKEN || await getSetting('blob_read_write_token');
  
  let googleAccountsRaw = await getSetting('google_drive_accounts');
  let googleAccounts = [];
  try {
    googleAccounts = JSON.parse(googleAccountsRaw || '[]');
  } catch {
    googleAccounts = [];
  }

  console.log(`📦 Storage request: Active Provider = ${activeProvider}`);

  // AUTOMATIC BUCKET / CLOUD DETECTION
  if (activeProvider === 'AUTO' || activeProvider === 'VERCEL_BLOB') {
    if (vercelToken) {
      try {
        console.log('🌐 Automatic Vercel Blob Bucket upload...');
        const url = await uploadToVercelBlob(fileBuffer, originalName);
        console.log('✅ Uploaded automatically to Vercel Cloud Bucket');
        return url;
      } catch (err) {
        console.warn(`⚠️ Vercel Blob bucket upload failed: ${err.message}. Trying Google Drive / Local...`);
      }
    }
  }

  // GOOGLE DRIVE WITH MULTI-ACCOUNT FAILOVER
  if (activeProvider === 'GOOGLE_DRIVE' || (activeProvider === 'AUTO' && googleAccounts.length > 0)) {
    for (const acc of googleAccounts) {
      try {
        console.log(`🌐 Attempting upload to Google Drive Account: ${acc.name}...`);
        const url = await uploadToGoogleDriveAccount(fileBuffer, originalName, acc);
        console.log(`✅ Uploaded successfully to Google Drive Account [${acc.name}]`);
        return url;
      } catch (err) {
        console.warn(`⚠️ Google Drive Account [${acc.name}] failed: ${err.message}. Trying next account...`);
      }
    }
  }

  // FALLBACK TO LOCAL STORAGE
  console.log('📂 Uploading to local server storage fallback...');
  return uploadToLocal(fileBuffer, originalName);
}
