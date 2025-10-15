import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Mock data - replace with actual data source in production
    const mockData = [
      { id: 1, name: 'Assessment 1', status: 'completed' },
      { id: 2, name: 'Assessment 2', status: 'pending' },
    ];

    // In production, replace this with actual data fetching
    const data = mockData;

    return new NextResponse(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="assessments-export.json"',
      },
    });
  } catch (error) {
    console.error('Export failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
