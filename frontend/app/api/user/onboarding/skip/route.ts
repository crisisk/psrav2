import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type SkipOnboardingResponse = {
  success: boolean;
  error?: string;
};

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json<SkipOnboardingResponse>({
        success: false,
        error: 'Unauthorized',
      }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        onboardingStatus: 'SKIPPED',
        onboardingCompletedAt: new Date(),
      },
    });

    return NextResponse.json<SkipOnboardingResponse>({ success: true });
  } catch (error) {
    console.error('[SKIP_ONBOARDING_ERROR]', error);
    return NextResponse.json<SkipOnboardingResponse>({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}
