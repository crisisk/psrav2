import { NextResponse } from 'next/server';

type AssessmentSection = {
  id: string;
  name: string;
  isComplete: boolean;
};

type ValidationRequest = {
  sections: AssessmentSection[];
};

type ValidationResponse = {
  isValid: boolean;
  missingSections?: string[];
  error?: string;
};

export async function POST(request: Request) {
  try {
    const body: ValidationRequest = await request.json();

    if (!body?.sections) {
      return NextResponse.json(
        { error: 'Missing sections data' } as ValidationResponse,
        { status: 400 }
      );
    }

    // Validate all 7 sections are present and complete
    const missingSections = body.sections
      .filter(section => !section.isComplete)
      .map(section => section.name);

    const isValid = missingSections.length === 0 && body.sections.length === 7;

    return NextResponse.json({
      isValid,
      ...(!isValid && { missingSections })
    } as ValidationResponse);

  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { error: 'Invalid request format' } as ValidationResponse,
      { status: 400 }
    );
  }
}
