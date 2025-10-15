/**
 * Email service for PSRA-LTSD
 */
import { sendEmail } from '@/lib/email';

export async function sendNotificationEmail(
  to: string,
  subject: string,
  message: string
) {
  return await sendEmail({
    to,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">${subject}</h2>
            <p style="color: #666; line-height: 1.6;">${message}</p>
          </div>
        </body>
      </html>
    `,
  });
}

export async function sendWelcomeEmail(to: string, name: string) {
  return await sendEmail({
    to,
    subject: 'Welcome to PSRA-LTSD',
    html: `
      <!DOCTYPE html>
      <html>
        <body>
          <h1>Welcome, ${name}!</h1>
          <p>Thank you for joining PSRA-LTSD.</p>
        </body>
      </html>
    `,
  });
}


export const emailService = {
  sendBulkEmail: async ({ recipients, subject, body }: { recipients: string[], subject: string, body: string }) => {
    console.log(`Sending bulk email to ${recipients.length} recipients. Subject: ${subject}`);
    return { success: true };
  },
};
