import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, hasPermission } from '../middleware/auth.js';
import { sendEmail } from '../services/emailService.js';

const router = express.Router();
const prisma = new PrismaClient();

const GOOGLE_DRIVE_INSTRUCTIONS = `
============================================================
📘 STEP-BY-STEP GUIDE: HOW TO CONNECT MULTIPLE GOOGLE DRIVE ACCOUNTS
============================================================

To allow Romantic T Solutions platform to save images and documents across multiple Google Drive accounts with automatic failover, follow these steps for EACH Google account:

1. STEP 1: OPEN GOOGLE CLOUD CONSOLE
   - Go to https://console.cloud.google.com/
   - Sign in with the Google Account you want to use for storage (Account 1: 15GB, Account 2: 15GB, etc.).

2. STEP 2: CREATE A PROJECT
   - Click the top project dropdown menu and select "New Project".
   - Name it "Romantic Drive Storage 1" and click Create.

3. STEP 3: ENABLE GOOGLE DRIVE API
   - In the left sidebar, click "APIs & Services" > "Library".
   - Search for "Google Drive API".
   - Click on it and press "ENABLE".

4. STEP 4: CONFIGURE OAUTH CONSENT SCREEN
   - Go to "APIs & Services" > "OAuth consent screen".
   - Choose "External" and click Create.
   - Enter App Name: "Romantic T Solutions Platform", Support Email, and Developer Contact Email.
   - Click "Save and Continue" through all screens.

5. STEP 5: CREATE OAUTH CLIENT CREDENTIALS
   - Go to "APIs & Services" > "Credentials".
   - Click "+ Create Credentials" > "OAuth client ID".
   - Select Application Type: "Web Application".
   - Under "Authorized redirect URIs", add:
     https://developers.google.com/oauthplayground
   - Click "Create" and copy your Client ID and Client Secret.

6. STEP 6: GENERATE REFRESH TOKEN
   - Open OAuth 2.0 Playground: https://developers.google.com/oauthplayground
   - Click the Gear Icon ⚙️ (top right corner).
   - Check the box: "Use your own OAuth credentials".
   - Paste your Client ID and Client Secret.
   - In the left list under "Drive API v3", select:
     https://www.googleapis.com/auth/drive.file
   - Click "Authorize APIs" and sign in with your Google account.
   - Click "Exchange authorization code for tokens".
   - Copy the generated "Refresh Token".

7. STEP 7: PASTE INTO ROMANTIC APP SETTINGS
   - In the Romantic Settings page below, enter:
     * Account Label (e.g. "Primary Storage 15GB")
     * Client ID
     * Client Secret
     * Refresh Token
   - Click "Add Account to Failover Pool".
   - Repeat the process to add Account 2, Account 3, etc.!
============================================================
`;

/**
 * Public & Admin: Get All System Settings
 */
router.get('/', async (req, res) => {
  try {
    const settings = await prisma.setting.findMany();
    const settingsMap = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    return res.json({
      settings: settingsMap,
      googleDriveGuide: GOOGLE_DRIVE_INSTRUCTIONS,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Admin: Update System Settings
 */
router.put('/', authenticateToken, hasPermission('settings.manage'), async (req, res) => {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Settings object required' });
    }

    for (const [key, value] of Object.entries(settings)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: typeof value === 'object' ? JSON.stringify(value) : String(value) },
        create: {
          key,
          value: typeof value === 'object' ? JSON.stringify(value) : String(value),
          category: key.includes('email') || key.includes('smtp') || key.includes('resend') ? 'EMAIL' : (key.includes('storage') || key.includes('drive') ? 'STORAGE' : 'GENERAL'),
        }
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'SETTINGS_UPDATED',
        entity: 'Setting',
      }
    });

    return res.json({ message: 'Settings saved successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Admin: Test Email Dispatch (Resend API -> SMTP fallback)
 */
router.post('/test-email', authenticateToken, hasPermission('settings.manage'), async (req, res) => {
  try {
    const { testEmail } = req.body;
    const target = testEmail || req.user.email;

    const result = await sendEmail({
      to: target,
      subject: 'Romantic T Solutions - Email Integration Test',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Test Email Successful</h2>
          <p>This email verifies that your email provider configuration for <strong>Romantic T Solutions Ltd</strong> is working properly.</p>
        </div>
      `,
      text: 'Test Email Successful from Romantic T Solutions Ltd.'
    });

    return res.json({
      message: `Test email processed to ${target}`,
      result,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
