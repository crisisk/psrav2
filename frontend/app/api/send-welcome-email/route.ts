import { NextResponse } from 'next/server';
import { z } from 'zod';
import { emailClient } from '@/lib/email';

// Schema for request validation
const WelcomeEmailSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
});

export async function POST(request: Request) {
  try {
    // Rate limiting check (mock implementation)
    const rateLimitKey = request.headers.get('x-ratelimit-key');
    if (rateLimitKey && parseInt(rateLimitKey) > 5) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validationResult = WelcomeEmailSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    // Send welcome email
    const { email, name } = validationResult.data;
    await emailClient.sendWelcomeEmail({
      to: email,
      subject: 'Welcome to Conformity Assessment Tracker',
      text: `Hello ${name}, welcome to our platform!`,
      html: `<h1>Welcome ${name}</h1><p>Thank you for joining our platform!</p>`,
    });

    return NextResponse.json(
      { success: true, message: 'Welcome email sent' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
