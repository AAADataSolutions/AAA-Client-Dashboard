import nodemailer from 'nodemailer';

export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || process.env.SMTP_USER || 'support@aaadatasolutions.com';
export const NOREPLY_EMAIL = process.env.NOREPLY_EMAIL || 'noreply@aaadatasolutions.com';

export function getNoReplyFromAddress(): string {
  return `"AAA Data Solutions" <${NOREPLY_EMAIL}>`;
}

export function getSupportFromAddress(): string {
  const user = process.env.SMTP_USER || 'support@aaadatasolutions.com';
  return `"AAA Data Solutions Support" <${user}>`;
}

export function getFromAddress(): string {
  return getNoReplyFromAddress();
}

export function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.office365.com';
  const user = process.env.SMTP_USER || 'support@aaadatasolutions.com';
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass || pass === 'your-outlook-password') {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}
