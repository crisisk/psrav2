/**
 * Email utilities for PSRA-LTSD
 */
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string | string[];
  from?: string;
  subject: string;
  html?: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions) {
  const from = options.from || 'noreply@psra-ltsd.com';

  const { data, error } = await resend.emails.send({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}

export async function sendWelcomeEmail(options: EmailOptions) {
  console.log('[Email] Sending welcome email:', options.subject, 'to', options.to);
  return { id: `email-${Date.now()}` };
}

export const emailClient = {
  send: sendEmail,
  sendNotification: sendEmailNotification,
  sendWelcomeEmail: sendWelcomeEmail,
};

export async function sendEmailNotification(options: EmailOptions) {
  console.log('[Email] Sending notification:', options.subject, 'to', options.to);
  return { id: `email-${Date.now()}` };
}

export async function sendInvitationEmail(
  to: string,
  invitationLink: string,
  senderName: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
      <body>
        <h1>You're Invited!</h1>
        <p>${senderName} has invited you to join PSRA-LTSD.</p>
        <a href="${invitationLink}">Accept Invitation</a>
      </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: "You're invited to PSRA-LTSD",
    html,
  });
}
