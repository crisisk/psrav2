import { NextResponse } from 'next/server';

interface AuditLogOptionsResponse {
  actions: string[];
  users: Array<{ id: string; name: string }>;
  dateRange: {
    minDate: string;
    maxDate: string;
  };
}

export async function GET() {
  try {
    // Simulate database fetch or external API call
    const options: AuditLogOptionsResponse = {
      actions: ['CREATE', 'UPDATE', 'DELETE'],
      users: [
        { id: '1', name: 'Admin' },
        { id: '2', name: 'Support' },
      ],
      dateRange: {
        minDate: '2024-01-01',
        maxDate: new Date().toISOString().split('T')[0],
      },
    };

    return NextResponse.json(options, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch audit log options' },
      { status: 500 }
    );
  }
}
