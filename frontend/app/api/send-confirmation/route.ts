import { NextResponse } from 'next/server';
import { z } from '@/lib/zod';
import { Resend } from 'resend';

// Email template with Tailwind CSS inline styles
const EmailTemplate = ({ tier }: { tier: string }) => `
  <div class="bg-white p-6 rounded-lg shadow-lg">
    <h1 class="text-2xl font-bold text-gray-800 mb-4">Tier Confirmation</h1>
    <p class="text-gray-700 mb-4">
      Your ${tier} tier subscription has been successfully confirmed!
    </p>
    <p class="text-gray-600 text-sm">
      This is an automated confirmation message. Please do not reply directly to this email.
    </p>
  </div>
`;

// Validation schema for request body
const requestSchema = z.object({
  email: z.string().email('Invalid email address'),
  tier: z.string().min(1, 'Tier selection is required')
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = requestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, tier } = validationResult.data;
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send confirmation email
    const { error } = await resend.emails.send({
      from: 'confirmation@example.com',
      to: email,
      subject: 'Tier Subscription Confirmed',
      html: EmailTemplate({ tier })
    });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json(
      { success: true, message: 'Confirmation email sent successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error 
          ? error.message 
          : 'Failed to send confirmation email' 
      },
      { status: 500 }
    );
  }
}
