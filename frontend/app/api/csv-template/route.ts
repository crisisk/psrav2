import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // CSV template data - can be extended with more complex generation logic
    const CSV_TEMPLATE = `ID,AssessmentName,Status,AssessmentDate,ComplianceStandard
1,Example Assessment,Pending,2024-03-15,ISO-9001
2,Another Assessment,Completed,2024-03-20,ISO-14001`;

    return new NextResponse(CSV_TEMPLATE, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="conformity-assessment-template.csv"',
      },
    });
  } catch (error) {
    console.error('[CSV_TEMPLATE_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to generate CSV template' },
      { status: 500 }
    );
  }
}
