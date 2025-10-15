import { NextResponse } from 'next/server';
import { z } from 'zod';

// Schema for request validation
const requestSchema = z.object({
  certificateIds: z.array(z.string().uuid()).min(1),
  tenantId: z.string().uuid()
});

export async function POST(request: Request) {
  try {
    // Validate request body
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { certificateIds, tenantId } = validation.data;

    // Mock validation logic - replace with actual database/service integration
    const isValid = certificateIds.every(id => {
      // In real implementation, check if certificate belongs to tenant
      return id.startsWith(tenantId.slice(0, 3)); // Example validation logic
    });

    return NextResponse.json({
      valid: isValid,
      message: isValid 
        ? 'All certificates belong to the tenant'
        : 'Some certificates do not belong to the tenant'
    });

  } catch (error) {
    console.error('Certificate validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
