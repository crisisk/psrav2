import { NextResponse } from 'next/server';
import { z } from '@/lib/zod';

// Input validation schema
const CalculationSchema = z.object({
  assessmentId: z.string().min(1),
  scores: z.array(z.number().min(0).max(100)),
  weights: z.array(z.number().min(1).max(100)),
  threshold: z.number().min(0).max(100).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate input
    const validation = CalculationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { scores, weights, threshold = 75 } = validation.data;

    // Check array lengths match
    if (scores.length !== weights.length) {
      return NextResponse.json(
        { error: 'Scores and weights arrays must have the same length' },
        { status: 400 }
      );
    }

    // Check weights sum to 100
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    if (Math.round(totalWeight) !== 100) {
      return NextResponse.json(
        { error: 'Weights must sum to 100%' },
        { status: 400 }
      );
    }

    // Calculate weighted score
    const totalScore = scores.reduce(
      (sum, score, index) => sum + (score * weights[index]) / 100,
      0
    );

    // Determine compliance
    const isCompliant = totalScore >= threshold;

    return NextResponse.json({
      success: true,
      result: {
        totalScore: Number(totalScore.toFixed(2)),
        isCompliant,
        threshold,
        calculatedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[CALCULATION_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
