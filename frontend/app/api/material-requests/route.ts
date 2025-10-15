import { NextResponse } from 'next/server';
import { z } from 'zod';

const requestSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  urgency: z.enum(['low', 'medium', 'high']),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = requestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten() },
        { status: 400 }
      );
    }

    // In real implementation, add to database here
    // await db.materialRequest.create({ data: validation.data });

    return NextResponse.json(
      { message: 'Request submitted successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Material request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
