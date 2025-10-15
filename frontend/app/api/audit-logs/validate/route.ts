import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { AuditLogSchema } from '@/lib/validations/audit-log';

export async function POST(req: NextRequest) {
  try {
    // Verify request method
    if (req.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = AuditLogSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 422 }
      );
    }

    // Return success response with validated data
    return NextResponse.json(
      {
        success: true,
        data: validationResult.data,
        message: 'Audit log entry is valid',
      },
      { status: 200 }
    );

  } catch (error) {
    // Handle different error types
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    console.error('Validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
