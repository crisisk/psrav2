import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PasswordStrengthRequest, PasswordStrengthResponse } from '@/lib/types/password';
import { checkPasswordStrength } from '@/lib/utils/password';

const schema = z.object({
  password: z.string().min(1, 'Password is required')
});

export async function POST(request: NextRequest) {
  try {
    const body: PasswordStrengthRequest = await request.json();
    
    // Validate request body
    const validation = schema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    // Calculate password strength
    const result = checkPasswordStrength(body.password);
    
    return NextResponse.json<PasswordStrengthResponse>({
      score: result.score,
      feedback: result.feedback,
      isValid: result.isValid
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request format' },
      { status: 400 }
    );
  }
}
