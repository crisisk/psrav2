import { NextResponse } from 'next/server';
import { z } from '@/lib/zod';

// Schema for request validation
const RequestSchema = z.object({
  materialName: z.string().min(3, 'Material name must be at least 3 characters'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  urgency: z.enum(['low', 'medium', 'high']),
  additionalNotes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = RequestSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    // Simulate database operation
    // In production, this would connect to your actual database
    const newRequest = {
      ...validation.data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    return NextResponse.json(
      { success: true, data: newRequest },
      { status: 201 }
    );

  } catch (error) {
    console.error('[REQUESTS_API_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
