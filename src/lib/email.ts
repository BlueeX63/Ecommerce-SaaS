import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

type SendMailOptions = {
  to: string;
  subject: string;
  html: string;
};

export async function sendMail({ to, subject, html }: SendMailOptions) {
  const from = process.env.SMTP_FROM || 'noreply@ecommerce-saas.com';
  
  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    console.log(`[EMAIL] Sent message to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[EMAIL] Failed to send email to ${to}`, error);
    return false;
  }
}
