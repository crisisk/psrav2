import { NextResponse } from 'next/server';
import { z } from 'zod';

// Commission tier configuration type
type CommissionTier = {
  min: number;
  max: number | null;
  rate: number;
};

// Predefined commission tiers (example values)
const COMMISSION_TIERS: CommissionTier[] = [
  { min: 0, max: 5000, rate: 0.05 },
  { min: 5001, max: 10000, rate: 0.07 },
  { min: 10001, max: 20000, rate: 0.1 },
  { min: 20001, max: null, rate: 0.12 },
];

// Zod schema for request validation
const requestSchema = z.object({
  salesAmount: z.number().positive().safe()
});

export async function POST(request: Request) {
  try {
    // Validate request body
    const body = await request.json();
    const validationResult = requestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { salesAmount } = validationResult.data;

    // Find applicable tier
    const applicableTier = COMMISSION_TIERS.find(tier => 
      salesAmount >= tier.min && 
      (tier.max === null || salesAmount <= tier.max)
    );

    if (!applicableTier) {
      return NextResponse.json(
        { error: 'No commission tier found for sales amount' },
        { status: 400 }
      );
    }

    // Calculate commission
    const commission = salesAmount * applicableTier.rate;

    return NextResponse.json({
      salesAmount,
      commissionRate: applicableTier.rate,
      commissionAmount: commission,
      tierRange: applicableTier.max 
        ? `${applicableTier.min}-${applicableTier.max}` 
        : `${applicableTier.min}+`
    });

  } catch (error) {
    console.error('[COMMISSIONS_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
