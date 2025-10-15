import { NextResponse, type NextRequest } from 'next/server';
import { type AuditLog } from '@/lib/types';

// Validation schema for request body
interface DownloadRequest {
  resourceId: string;
  format: 'csv' | 'json';
}

export async function POST(req: NextRequest) {
  try {
    // Validate request method
    if (req.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
    }

    // Parse and validate request body
    const body = (await req.json()) as DownloadRequest;
    if (!body.resourceId || !body.format) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['csv', 'json'].includes(body.format)) {
      return NextResponse.json(
        { error: 'Invalid format specified' },
        { status: 400 }
      );
    }

    // Mock data - replace with actual data source in production
    const auditData: AuditLog[] = [
      {
        id: '1',
        action: 'CREATE',
        userId: 'user_123',
        resourceId: body.resourceId,
        timestamp: new Date(),
        details: 'Resource created'
      }
    ];

    // Format response based on requested format
    let content: string;
    let contentType: string;
    let fileName: string;

    if (body.format === 'csv') {
      contentType = 'text/csv';
      fileName = `audit-log-${body.resourceId}.csv`;
      content = 'id,action,userId,resourceId,timestamp,details\n' +
        auditData.map(item =>
          `${item.id},${item.action},${item.userId},${item.resourceId},${item.timestamp},${item.details}`
        ).join('\n');
    } else {
      contentType = 'application/json';
      fileName = `audit-log-${body.resourceId}.json`;
      content = JSON.stringify(auditData, null, 2);
    }

    // Create response with file data
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`
      }
    });

  } catch (error) {
    console.error('[AUDIT_LOG_DOWNLOAD_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
