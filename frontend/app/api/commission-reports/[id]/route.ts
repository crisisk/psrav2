import { NextResponse } from 'next/server';
import { z } from 'zod';

// Type definition for commission report
interface CommissionReport {
  id: string;
  assessmentId: string;
  commissioner: string;
  reportDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  findings: string;
  recommendations: string;
}

// Mock data (replace with database integration)
const mockReports: CommissionReport[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    assessmentId: 'CA-2023-0456',
    commissioner: 'Safety Commission EU',
    reportDate: '2023-11-15',
    status: 'Approved',
    findings: 'Full compliance with regulation (EU) 2023/1234',
    recommendations: 'Maintain current quality control procedures'
  }
];

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validate UUID format
    const uuidSchema = z.string().uuid();
    const validationResult = uuidSchema.safeParse(params.id);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid report ID format' },
        { status: 400 }
      );
    }

    const report = mockReports.find(r => r.id === params.id);

    if (!report) {
      return NextResponse.json(
        { error: 'Commission report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('[COMMISSION_REPORTS_GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
