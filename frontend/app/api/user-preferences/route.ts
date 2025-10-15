import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

// Schema for request validation
const preferenceSchema = z.object({
  modelName: z.string().min(1),
  isEnabled: z.boolean()
});

export async function POST(req: Request) {
  try {
    // Authentication check
    const session = await getSession(req);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate request body
    const body = await req.json();
    const validation = preferenceSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // In a real implementation, this would update the database
    // For now, we'll return a mock success response
    return NextResponse.json({
      success: true,
      message: 'Preferences updated',
      updatedPreference: validation.data
    });

  } catch (error) {
    console.error('[USER_PREFERENCES_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
