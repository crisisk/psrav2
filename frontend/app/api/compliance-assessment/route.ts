import { NextResponse } from 'next/server';
import { z } from '@/lib/zod';

export const runtime = 'edge';

const RiskLevels = z.enum(['I', 'II', 'III', 'IV']);
const AICategories = z.enum(['Prohibited', 'HighRisk', 'LimitedRisk', 'MinimalRisk']);

const ComplianceRequestSchema = z.object({
  systemDescription: z.string().min(10),
  intendedUse: z.string().min(10),
  dataSources: z.array(z.string()).min(1),
  riskLevel: RiskLevels,
  category: AICategories
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = ComplianceRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { systemDescription, category, riskLevel } = validation.data;

    // Simulate compliance check business logic
    const isCompliant = category !== 'Prohibited' && riskLevel !== 'IV';
    const requirements = {
      documentation: systemDescription.length > 100,
      riskAssessment: ['III', 'IV'].includes(riskLevel),
      humanOversight: category === 'HighRisk'
    };

    return NextResponse.json({
      compliant: isCompliant,
      requirements,
      nextSteps: isCompliant ? ['Submit conformity declaration'] : ['Modify system design', 'Conduct risk assessment'],
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('[ComplianceAssessment] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
