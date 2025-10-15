import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

const RateSchema = z.object({
  technical: z.number().min(0).max(100),
  implementation: z.number().min(0).max(100),
  maintenance: z.number().min(0).max(100),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = RateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    // Update commission rates in database
    const updatedRates = await db.commissionRates.update({
      where: { id: 'default' },
      data: validation.data,
    });

    return NextResponse.json(
      { rates: updatedRates },
      { status: 200 }
    );
  } catch (error) {
    console.error('[COMMISSION_RATES]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
