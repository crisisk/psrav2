import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/db';

const disputeSchema = z.object({
  assessmentId: z.string().uuid(),
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(1000),
  evidence: z.string().url().array().min(1),
  userId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = disputeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    const dispute = await prisma.dispute.create({
      data: {
        ...validation.data,
        status: 'OPEN',
        createdAt: new Date(),
      },
    });

    return NextResponse.json(dispute, { status: 201 });
  } catch (error) {
    console.error('[DISPUTES_POST]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
