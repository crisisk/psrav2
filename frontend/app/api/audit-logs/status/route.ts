import { NextResponse } from 'next/server';

// Type definitions for audit log status
export interface AuditLogStatus {
  id: string;
  status: 'pending' | 'processing' | 'complete' | 'error';
  timestamp: string;
  message?: string;
}

export async function GET() {
  try {
    // Mock data - replace with actual data source in production
    const mockStatuses: AuditLogStatus[] = [
      {
        id: '1',
        status: 'complete',
        timestamp: '2024-03-20T14:30:00Z',
        message: 'Successfully processed 250 records'
      },
      {
        id: '2',
        status: 'processing',
        timestamp: '2024-03-20T14:35:00Z',
        message: 'Currently processing batch 3/5'
      }
    ];

    return NextResponse.json(mockStatuses, { status: 200 });
  } catch (error) {
    console.error('[AUDIT_LOG_STATUS]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
