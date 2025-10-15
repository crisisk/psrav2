import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AssignTierSchema } from '@/lib/validations/partner-tier';

// Tier assignment criteria interface
interface TierCriteria {
  minScore: number;
  maxScore: number;
  tier: string;
}

// Request body schema


// Tier determination logic
const determinePartnerTier = (score: number): string => {
  const tierCriteria: TierCriteria[] = [
    { minScore: 0, maxScore: 49, tier: 'Bronze' },
    { minScore: 50, maxScore: 74, tier: 'Silver' },
    { minScore: 75, maxScore: 89, tier: 'Gold' },
    { minScore: 90, maxScore: 100, tier: 'Platinum' }
  ];

  const matchedTier = tierCriteria.find(
    criteria => score >= criteria.minScore && score <= criteria.maxScore
  );

  return matchedTier?.tier || 'Unassigned';
};

export async function POST(request: Request) {
  try {
    // Validate request body
    const body = await request.json();
    const validationResult = AssignTierSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { partnerId, assessmentScore } = validationResult.data;

    // Determine tier
    const assignedTier = determinePartnerTier(assessmentScore);

    // In production: Add database update logic here
    // await db.partners.update(...)

    return NextResponse.json({
      success: true,
      partnerId,
      assignedTier,
      assessmentScore,
      effectiveDate: new Date().toISOString()
    });

  } catch (error) {
    console.error('[PartnerTier] Assignment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
