import { NextResponse } from 'next/server';
import { z } from 'zod';

type Assessment = {
  id: string;
  title: string;
  status: 'pending' | 'completed' | 'in-progress';
  dueDate: string;
  createdAt: string;
};

const assessmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  dueDate: z.string().datetime('Invalid date format'),
});

// In-memory database for demonstration
let assessments: Assessment[] = [];

export async function GET() {
  try {
    return NextResponse.json({ data: assessments });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = assessmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors },
        { status: 400 }
      );
    }

    const newAssessment: Assessment = {
      id: Date.now().toString(),
      title: body.title,
      status: 'pending',
      dueDate: new Date(body.dueDate).toISOString(),
      createdAt: new Date().toISOString(),
    };

    assessments.push(newAssessment);
    return NextResponse.json(newAssessment, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create assessment' },
      { status: 500 }
    );
  }
}
