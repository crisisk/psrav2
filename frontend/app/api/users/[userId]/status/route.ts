import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

const UserStatusSchema = z.object({
  id: z.string(),
  isActive: z.boolean(),
  isSuspended: z.boolean(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Validate userId format
    const userIdValidation = z.string().uuid().safeParse(params.userId);
    if (!userIdValidation.success) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Simulated database fetch - replace with actual DB call
    const mockUser = {
      id: params.userId,
      isActive: true,
      isSuspended: false,
    };

    // Validate response structure
    const validationResult = UserStatusSchema.safeParse(mockUser);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid user data structure' },
        { status: 500 }
      );
    }

    const { isActive, isSuspended } = validationResult.data;
    let status: 'active' | 'inactive' | 'suspended' = 'inactive';

    if (isSuspended) {
      status = 'suspended';
    } else if (isActive) {
      status = 'active';
    }

    return NextResponse.json({
      userId: params.userId,
      status,
      lastChecked: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[UserStatus] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
