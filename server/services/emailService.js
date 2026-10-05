import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getSetting(key) {
  try {
    const s = await prisma.setting.findUnique({ where: { key } });
    return s ? s.value : process.env[key.toUpperCase()];
  } catch {
    return process.env[key.toUpperCase()];
  }
}

export async function sendEmail({ to, subject, html, text }) {
  const resendApiKey = (await getSetting('resend_api_key')) || process.env.RESEND_API_KEY;
  const customFromEmail = (await getSetting('resend_from_email')) || process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || 'Romantic T Solutions <onboarding@resend.dev>';
  
  const smtpHost = (await getSetting('smtp_host')) || process.env.SMTP_HOST;
  const smtpPort = (await getSetting('smtp_port')) || process.env.SMTP_PORT || 587;
  const smtpUser = (await getSetting('smtp_user')) || process.env.SMTP_USER;
  const smtpPass = (await getSetting('smtp_pass')) || process.env.SMTP_PASS;

  let errors = [];

  let cleanFromEmail = customFromEmail ? customFromEmail.trim() : 'Isando <onboarding@resend.dev>';
  if (cleanFromEmail.includes('@gmail.com') || cleanFromEmail.includes('@yahoo.com') || cleanFromEmail.includes('@hotmail.com')) {
    console.warn(`⚠️ Resend does not allow free domains (${cleanFromEmail}) as "from". Using Isando <onboarding@resend.dev>.`);
    cleanFromEmail = 'Isando <onboarding@resend.dev>';
  } else if (!cleanFromEmail.includes('<') && cleanFromEmail.includes('@')) {
    cleanFromEmail = `Isando <${cleanFromEmail}>`;
  }

  // Attempt 1: Resend API with custom FROM email
  if (resendApiKey) {
    try {
      console.log(`✉️ Attempting to send email via Resend to ${to} (From: ${cleanFromEmail})...`);
      const resend = new Resend(resendApiKey);
      const data = await resend.emails.send({
        from: cleanFromEmail,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
      });

      if (data && !data.error && data.id) {
        console.log(`✅ Email sent successfully via Resend API to ${to} (ID: ${data.id})`);
        return { success: true, provider: 'Resend', id: data.id };
      }

      if (data?.error) {
        const errMsg = data.error.message || JSON.stringify(data.error);
        console.warn(`❌ Resend API returned error: ${errMsg}`);
        errors.push(`Resend error: ${errMsg}`);
      }
    } catch (err) {
      console.warn(`⚠️ Resend API exception: ${err.message}.`);
      errors.push(`Resend exception: ${err.message}`);
    }
  } else {
    errors.push('RESEND_API_KEY is not configured in Vercel environment variables or database settings.');
  }

  // Attempt 2: SMTP Fallback
  if (smtpHost && smtpUser && smtpPass) {
    try {
      console.log(`✉️ Attempting to send email via SMTP fallback to ${to}...`);
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort),
        secure: Number(smtpPort) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: customFromEmail,
        to,
        subject,
        html,
        text,
      });

      console.log(`✅ Email sent successfully via SMTP to ${to} (MessageId: ${info.messageId})`);
      return { success: true, provider: 'SMTP', messageId: info.messageId };
    } catch (err) {
      console.error(`❌ SMTP fallback failed: ${err.message}`);
      errors.push(`SMTP exception: ${err.message}`);
    }
  }

  // If both Resend and SMTP failed
  const primaryError = errors[0] || 'Email could not be delivered';
  console.log('====================================================');
  console.log(`📧 [EMAIL DELIVERY FAILED]`);
  console.log(`TO: ${to}`);
  console.log(`REASON: ${primaryError}`);
  console.log('====================================================');

  return {
    success: false,
    provider: 'FAILED',
    error: primaryError,
    errors,
  };
}

export async function sendOtpEmail(toEmail, otpCode) {
  const subject = `Your Verification Code: ${otpCode} - Isando | Romantic T Solutions`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee7cf; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #1F2430; margin: 0; font-size: 24px;">Isando</h2>
        <p style="color: #667085; font-size: 14px; margin-top: 4px; font-weight: 600;">Romantic T Solutions Ltd Platform</p>
      </div>
      <div style="background-color: #FBF8EE; border-left: 4px solid #F5B700; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 8px 0; color: #1F2430;">Secure Verification Code</h3>
        <p style="margin: 0; color: #4b5563; font-size: 15px;">Use the 6-digit code below to sign in to your Isando account.</p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #D7263D; background: #ffffff; padding: 12px 24px; border: 2px dashed #F5B700; border-radius: 10px; display: inline-block;">
            ${otpCode}
          </span>
        </div>
        <p style="margin: 0; color: #667085; font-size: 13px; text-align: center;">This code will expire in 10 minutes.</p>
      </div>
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">If you did not request this code, please ignore this message.</p>
    </div>
  `;
  const text = `Your Isando (Romantic T Solutions) verification code is: ${otpCode}. Expires in 10 minutes.`;

  return sendEmail({ to: toEmail, subject, html, text });
}

export async function sendUserInviteEmail(toEmail, fullName, roleName, inviteLink) {
  const subject = `You have been invited to Isando | Romantic T Solutions Ltd`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #eee7cf; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #1F2430; margin: 0; font-size: 26px;">Isando</h2>
        <p style="color: #667085; font-size: 14px; margin-top: 4px; font-weight: 600;">Romantic T Solutions Ltd Platform</p>
      </div>
      <div style="background-color: #FBF8EE; border-left: 4px solid #F5B700; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px 0; color: #1F2430;">Welcome, ${fullName}!</h3>
        <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 15px; line-height: 1.5;">
          You have been added to <strong>Isando</strong> (Romantic T Solutions Ltd) as <strong>${roleName || 'Team Member'}</strong>.
        </p>
        <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 15px; line-height: 1.5;">
          Click the button below to accept your invite and sign in. A verification code (OTP) will be sent to your inbox when you open the link.
        </p>
        <div style="text-align: center; margin: 24px 0;">
          <a href="${inviteLink}" style="background-color: #F5B700; color: #1F2430; font-weight: bold; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
            Accept Invitation & Log In
          </a>
        </div>
      </div>
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">If you believe this invitation was sent in error, please disregard this email.</p>
    </div>
  `;
  const text = `Welcome ${fullName}! You have been invited to Isando (Romantic T Solutions) as ${roleName || 'Team Member'}. Log in here: ${inviteLink}`;

  return sendEmail({ to: toEmail, subject, html, text });
}


