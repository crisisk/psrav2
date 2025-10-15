import { NextResponse } from 'next/server';
import { z } from 'zod';

type StatusResponse = {
  assessmentId: string;
  completed: boolean;
  progress?: number;
  message?: string;
};

const uuidSchema = z.string().uuid({ message: 'Invalid assessment ID format' });

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validate UUID format
    const validationResult = uuidSchema.safeParse(params.id);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    // Simulate async status check (replace with actual database query)
    const isCompleted = Math.random() > 0.5;
    
    // Mock progress percentage
    const progress = isCompleted ? 100 : Math.floor(Math.random() * 30) + 40;

    return NextResponse.json<StatusResponse>({
      assessmentId: params.id,
      completed: isCompleted,
      progress,
      message: isCompleted ? 'Assessment completed' : 'Assessment in progress'
    });

  } catch (error) {
    console.error('Polling error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
