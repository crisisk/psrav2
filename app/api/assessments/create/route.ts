import { NextResponse } from 'next/server';
import { proxyRequest } from '@/lib/proxy';
import { shouldUseMock } from '@/lib/mock';

interface OriginCheckFormData {
  product: string;
  hsCode: string;
  agreement: string;
  bom: any[];
}

export async function POST(request: Request) {
  try {
    const formData: OriginCheckFormData = await request.json();

    if (shouldUseMock()) {
      // Mock response with random assessment ID
      const mockAssessmentId = Math.random().toString(36).substring(2, 15);
      
      return NextResponse.json({
        assessmentId: mockAssessmentId,
        status: 'created'
      });
    }

    // Proxy to backend
    const response = await proxyRequest('/api/assessments/create', {
      method: 'POST',
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      assessmentId: data.assessmentId,
      status: 'created'
    });

  } catch (error) {
    console.error('Error creating assessment:', error);
    return NextResponse.json(
      { error: 'Failed to create assessment' },
      { status: 500 }
    );
  }
}
