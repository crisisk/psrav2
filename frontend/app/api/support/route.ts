import { NextResponse } from 'next/server';
import { z } from 'zod';

const SupportRequestSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  subject: z.string().min(5, { message: 'Subject must be at least 5 characters' }),
  message: z.string().min(10, { message: 'Message must be at least 10 characters' })
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = SupportRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    // In production: implement actual support ticket creation
    // await sendSupportEmail(validation.data);
    // Example: await createSupportTicket(validation.data);

    return NextResponse.json(
      { success: true, message: 'Support request submitted successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('[SUPPORT_REQUEST_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
