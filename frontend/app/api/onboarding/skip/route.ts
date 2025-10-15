import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import type { ApiResponse } from '@/types/api';

export async function POST(): Promise<NextResponse<ApiResponse>> {
  try {
    // Verify user authentication
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Update user's onboarding status
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        onboardingSkipped: true,
        onboardingCompleted: new Date()
      }
    });

    return NextResponse.json(
      { success: true, data: updatedUser },
      { status: 200 }
    );
  } catch (error) {
    console.error('[ONBOARDING_SKIP_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
