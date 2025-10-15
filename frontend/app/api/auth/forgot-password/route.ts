import { NextResponse } from 'next/server';
import { z } from 'zod';
import crypto from 'crypto';

// Schema for email validation
const EmailSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = EmailSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Simulate user lookup - replace with actual database check in production
    const userExists = true; // Temporary assumption
    if (!userExists) {
      return NextResponse.json(
        { error: 'No account found with this email address' },
        { status: 404 }
      );
    }

    // Generate reset token and expiry
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    // In production: store resetToken and resetTokenExpiry in database
    console.log('Password reset token:', resetToken); // Remove in production

    // Simulate email sending - replace with actual email service in production
    console.log(`Sending password reset email to ${email}`);

    return NextResponse.json({
      message: 'Password reset instructions sent to your email',
    });

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
