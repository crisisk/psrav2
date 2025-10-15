import { NextResponse } from 'next/server';
import { z } from 'zod';

const ContactSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  subject: z.string().min(5, { message: 'Subject must be at least 5 characters' }),
  message: z.string().min(20, { message: 'Message must be at least 20 characters' })
});

export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin');
    const body = await request.json();
    
    // Validate request body
    const validation = ContactSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    // Simulate email sending process
    console.log('Received support request:', validation.data);

    return NextResponse.json(
      { success: true, message: 'Support request received' },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error) {
    console.error('Error processing support request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
