import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transporter = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    })
  : null;

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!transporter) {
    console.error('[email] SMTP is not configured - cannot send e-mail');
    return false;
  }
  try {
    const info = await transporter.sendMail({ from: env.SMTP_FROM || 'noreply@ecommerce-saas.com', to, subject, html });
    console.log(`[email] sent message ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('[email] failed to send message', error);
    return false;
  }
}
