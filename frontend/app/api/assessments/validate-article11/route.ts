import { NextRequest, NextResponse } from 'next/server';
import { ZodError, z } from 'zod';
import { ValidationResult } from '@/lib/validations/article11';

const AssessmentSchema = z.object({
  documentId: z.string().min(5),
  expiryDate: z.string().datetime(),
  assessorId: z.string().uuid(),
  assessmentDate: z.string().datetime(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = AssessmentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { documentId, expiryDate, assessorId, assessmentDate } = validation.data;
    
    // Simulate actual validation logic
    const validationResults: ValidationResult = {
      isValid: true,
      requirements: [
        {
          id: 'ART11-001',
          description: 'Document has valid certification mark',
          isValid: documentId.startsWith('CER-'),
          error: documentId.startsWith('CER-') ? undefined : 'Invalid certification mark'
        },
        {
          id: 'ART11-002',
          description: 'Assessment within validity period',
          isValid: new Date(assessmentDate) < new Date(expiryDate),
          error: new Date(assessmentDate) >= new Date(expiryDate) ? 'Assessment expired' : undefined
        },
        {
          id: 'ART11-003',
          description: 'Certified assessor',
          isValid: /^ASR-/.test(assessorId),
          error: /^ASR-/.test(assessorId) ? undefined : 'Assessor not certified'
        }
      ]
    };

    validationResults.isValid = validationResults.requirements.every(r => r.isValid);

    return NextResponse.json(validationResults, { status: 200 });

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
