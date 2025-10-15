import { NextResponse } from 'next/server';

// Type definitions for EU AI Act Article 11 requirements
interface AIValidationRequest {
  riskLevel: 'high' | 'medium' | 'low';
  hasRiskAssessment: boolean;
  documentationExists: boolean;
  transparencyMeasures: boolean;
  humanOversight: boolean;
}

interface ValidationResult {
  compliant: boolean;
  missingRequirements: string[];
  details: string;
}

export async function POST(request: Request) {
  try {
    const validationData: AIValidationRequest = await request.json();

    // Basic input validation
    if (!validationData.riskLevel || !['high', 'medium', 'low'].includes(validationData.riskLevel)) {
      return NextResponse.json(
        { error: 'Invalid risk level specified' },
        { status: 400 }
      );
    }

    const missingRequirements: string[] = [];

    // Article 11 core requirements validation
    if (validationData.riskLevel === 'high') {
      if (!validationData.hasRiskAssessment) missingRequirements.push('Risk assessment');
      if (!validationData.documentationExists) missingRequirements.push('Documentation');
      if (!validationData.transparencyMeasures) missingRequirements.push('Transparency measures');
      if (!validationData.humanOversight) missingRequirements.push('Human oversight');
    }

    // Medium risk systems have fewer requirements
    if (validationData.riskLevel === 'medium') {
      if (!validationData.documentationExists) missingRequirements.push('Documentation');
      if (!validationData.transparencyMeasures) missingRequirements.push('Transparency measures');
    }

    const isCompliant = missingRequirements.length === 0;

    const result: ValidationResult = {
      compliant: isCompliant,
      missingRequirements,
      details: isCompliant
        ? 'System meets all Article 11 requirements'
        : 'System fails to meet the following Article 11 requirements',
    };

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { error: 'Invalid request format or server error' },
      { status: 500 }
    );
  }
}
