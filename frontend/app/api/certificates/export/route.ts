import { NextResponse } from 'next/server';

// Type definition for certificate audit log entry
interface CertificateLog {
  id: string;
  certificateId: string;
  action: 'ISSUED' | 'REVOKED' | 'RENEWED';
  timestamp: Date;
  userId: string;
  userEmail: string;
}

export async function GET() {
  try {
    // In production, this would fetch from your database/service
    const mockData: CertificateLog[] = [
      {
        id: '1',
        certificateId: 'CERT-123',
        action: 'ISSUED',
        timestamp: new Date('2024-01-15'),
        userId: 'USER-001',
        userEmail: 'admin@example.com'
      },
      {
        id: '2',
        certificateId: 'CERT-456',
        action: 'REVOKED',
        timestamp: new Date('2024-01-16'),
        userId: 'USER-002',
        userEmail: 'auditor@example.com'
      }
    ];

    // Convert data to CSV format
    const csvContent = [
      'Certificate ID,Action,Timestamp,User ID,User Email',
      ...mockData.map(item =>
        [
          `"${item.certificateId}"`,
          `"${item.action}"`,
          `"${item.timestamp.toISOString()}"`,
          `"${item.userId}"`,
          `"${item.userEmail}"`
        ].join(',')
      )
    ].join('\n');

    // Create response with CSV data
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="certificate_audit_logs.csv"'
      }
    });
  } catch (error) {
    console.error('[CERTIFICATE_EXPORT_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to generate certificate export' },
      { status: 500 }
    );
  }
}
