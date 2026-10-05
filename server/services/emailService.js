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

  // Attempt 1: Resend API with custom FROM email
  if (resendApiKey) {
    try {
      console.log(`✉️ Attempting to send email via Resend to ${to} (From: ${customFromEmail})...`);
      const resend = new Resend(resendApiKey);
      const data = await resend.emails.send({
        from: customFromEmail,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
      });

      if (data && !data.error) {
        console.log(`✅ Email sent successfully via Resend API to ${to}`);
        return { success: true, provider: 'Resend', id: data.id };
      }
      if (data?.error) {
        errors.push(`Resend error: ${data.error.message || JSON.stringify(data.error)}`);
      }
    } catch (err) {
      console.warn(`⚠️ Resend API failed: ${err.message}. Falling back to SMTP...`);
      errors.push(`Resend exception: ${err.message}`);
    }
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

  // Attempt 3: Development console logger fallback
  console.log('====================================================');
  console.log(`📧 [DEV EMAIL SIMULATION]`);
  console.log(`FROM: ${customFromEmail}`);
  console.log(`TO: ${to}`);
  console.log(`SUBJECT: ${subject}`);
  console.log(`BODY TEXT: ${text || html}`);
  if (errors.length > 0) {
    console.log(`ERRORS ENCOUNTERED: ${errors.join(' | ')}`);
  }
  console.log('====================================================');

  return {
    success: true,
    provider: 'CONSOLE_SIMULATION',
    simulated: true,
    message: 'Email logged to console as fallback',
    errors,
  };
}

export async function sendOtpEmail(toEmail, otpCode) {
  const subject = `Your Verification Code: ${otpCode} - Romantic T Solutions`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee7cf; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #1F2430; margin: 0;">Romantic T Solutions Ltd</h2>
        <p style="color: #667085; font-size: 14px; margin-top: 4px;">Business, Services & Event Management Platform</p>
      </div>
      <div style="background-color: #FBF8EE; border-left: 4px solid #F5B700; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 8px 0; color: #1F2430;">Secure Verification Code</h3>
        <p style="margin: 0; color: #4b5563; font-size: 15px;">Use the 6-digit code below to sign in to your account.</p>
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
  const text = `Your Romantic T Solutions verification code is: ${otpCode}. Expire in 10 minutes.`;

  return sendEmail({ to: toEmail, subject, html, text });
}
