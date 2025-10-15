import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { z } from 'zod';

const InvitationSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = InvitationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.format() },
        { status: 400 }
      );
    }

    // Simulate invitation processing
    const { email } = validationResult.data;
    console.log(`Sending invitation to: ${email}`);

    // Add actual email sending logic here
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json(
      { message: 'Invitation sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Invitation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
