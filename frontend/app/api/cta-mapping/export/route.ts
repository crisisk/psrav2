import { NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/auth';
import { CtaMapping } from '@/types/cta';

// Mock data source (replace with actual database connection)
const mockCtaMappings: CtaMapping[] = [
  { id: '1', category: 'safety', target: 'EC_123', status: 'compliant' },
  { id: '2', category: 'emissions', target: 'EPA_456', status: 'pending' },
];

export async function GET(request: Request) {
  try {
    // Validate request method
    if (request.method !== 'GET') {
      return NextResponse.json(
        { error: 'Method Not Allowed' },
        { status: 405 }
      );
    }

    // Authenticate API key
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || !validateApiKey(apiKey)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Generate CSV content
    const csvContent = [
      'ID,Category,Target,Status',
      ...mockCtaMappings.map(m => 
        `${m.id},${m.category},${m.target},${m.status}`
      )
    ].join('\n');

    // Create response with CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="cta-mappings-export.csv"'
      },
    });

  } catch (error) {
    console.error('[CTA_EXPORT_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
