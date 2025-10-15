import { Resend } from 'resend';

type SendWelcomeEmailParams = {
  email: string;
};

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail({ email }: SendWelcomeEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable not configured');
  }

  const { data, error } = await resend.emails.send({
    from: 'onboarding@example.com',
    to: email,
    subject: 'Welcome to Our Platform!',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome aboard!</h1>
        <p>Thank you for joining our platform. We're excited to have you with us.</p>
        <p>Get started by exploring our features:</p>
        <ul>
          <li>Feature 1</li>
          <li>Feature 2</li>
          <li>Feature 3</li>
        </ul>
        <p>Need help? Contact our support team.</p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Resend API error: ${error.message}`);
  }

  return data;
}
