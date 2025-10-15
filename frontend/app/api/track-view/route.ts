import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    // Stub session for build - replace with actual auth in production
    const session = { user: { id: 'stub-user' } };

    // Authentication check
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Request validation
    const { assessmentId } = await req.json();
    if (!assessmentId || typeof assessmentId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid assessment ID' },
        { status: 400 }
      );
    }

    // Create view record
    const viewRecord = await prisma.viewRecord.create({
      data: {
        userId: session.user.id,
        assessmentId: assessmentId,
      },
    });

    return NextResponse.json({ success: true, viewRecord });
  } catch (error) {
    console.error('Tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
