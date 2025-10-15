import { NextResponse } from 'next/server';
import type { Commission } from '@/lib/types';
import { db } from '@/lib/db';

type ResponseData = {
  data?: Commission;
  error?: string;
};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const commissionId = params.id;

    if (!commissionId || isNaN(Number(commissionId))) {
      return NextResponse.json(
        { error: 'Invalid commission ID' },
        { status: 400 }
      );
    }

    const commission = await db.commission.findUnique({
      where: { id: Number(commissionId) },
      include: {
        documents: true,
        milestones: true,
        assignedTo: true
      }
    });

    if (!commission) {
      return NextResponse.json(
        { error: 'Commission not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: commission });
  } catch (error) {
    console.error('[COMMISSION_DETAILS]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
