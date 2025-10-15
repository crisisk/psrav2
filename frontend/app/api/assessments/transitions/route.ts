import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { AssessmentStage } from '@/lib/types/assessment';

const transitionRules: Record<AssessmentStage, AssessmentStage[]> = {
  [AssessmentStage.INITIATION]: [AssessmentStage.PLANNING],
  [AssessmentStage.PLANNING]: [AssessmentStage.EXECUTION, AssessmentStage.INITIATION],
  [AssessmentStage.EXECUTION]: [AssessmentStage.REVIEW],
  [AssessmentStage.REVIEW]: [AssessmentStage.CLOSED, AssessmentStage.EXECUTION],
  [AssessmentStage.CLOSED]: []
};

const transitionSchema = z.object({
  currentStage: z.nativeEnum(AssessmentStage),
  targetStage: z.nativeEnum(AssessmentStage)
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = transitionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.format() },
        { status: 400 }
      );
    }

    const { currentStage, targetStage } = validation.data;
    const allowedTransitions = transitionRules[currentStage];

    if (!allowedTransitions.includes(targetStage)) {
      return NextResponse.json(
        { 
          error: 'Invalid transition',
          currentStage,
          targetStage,
          allowedTransitions
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Transition validated',
      currentStage,
      targetStage
    });

  } catch (error) {
    console.error('Transition validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
