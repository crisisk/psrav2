import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface HistoryEntry {
  id: string;
  assessmentDate: string;
  status: 'Passed' | 'Failed' | 'Pending';
  inspector: string;
}

export async function POST(request: NextRequest) {
  try {
    // Validate request method
    if (request.method !== 'POST') {
      return new NextResponse(JSON.stringify({ message: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Simulate data fetching - replace with actual data source in production
    const mockHistoryData: HistoryEntry[] = Array.from({ length: 10 }, (_, i) => ({
      id: `ID-${i + 1000}`,
      assessmentDate: new Date(Date.now() - i * 86400000).toISOString(),
      status: ['Passed', 'Failed', 'Pending'][i % 3] as HistoryEntry['status'],
      inspector: `Inspector-${i + 1}`,
    }));

    // Convert data to CSV format
    const csvContent = [
      'ID,Assessment Date,Status,Inspector',
      ...mockHistoryData.map(item =>
        `${item.id},${item.assessmentDate},${item.status},${item.inspector}`
      )
    ].join('\n');

    // Create response with CSV data
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="assessment_history.csv"',
      },
    });

  } catch (error) {
    console.error('Download error:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
