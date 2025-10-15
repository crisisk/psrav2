import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  generateCommissionReport,
  type CommissionReportParams,
} from '@/lib/services/commission-service';

// Validation schema for request body
const ReportSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  partnerId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body: CommissionReportParams = await request.json();

    // Validate request body
    const validationResult = ReportSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Generate commission report
    const report = await generateCommissionReport(validationResult.data);

    return NextResponse.json(report, { status: 200 });
  } catch (error) {
    console.error('[COMMISSION_REPORT_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to generate commission report' },
      { status: 500 }
    );
  }
}
