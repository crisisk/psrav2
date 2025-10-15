import { NextResponse } from 'next/server';

// CSV template content with header and example rows
export async function GET() {
  try {
    // Generate CSV template content
    const csvContent = [
      ['Timestamp', 'Action', 'User ID', 'Entity Type', 'Entity ID', 'Details'],
      ['2024-01-01T12:00:00Z', 'CREATE', 'user_123', 'Document', 'doc_456', 'Initial creation'],
      ['2024-01-02T14:30:00Z', 'UPDATE', 'user_456', 'Profile', 'prof_789', 'Updated contact info']
    ]
    .map(row => row.join(','))
    .join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="audit-log-template.csv"',
      },
    });
  } catch (error) {
    console.error('[AUDIT_LOG_TEMPLATE_ERROR]', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

export const dynamic = 'force-dynamic';