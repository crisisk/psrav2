import { NextResponse } from 'next/server';

import { AuditLogStatus } from '@/lib/types/audit-log-status';

const validStatuses: AuditLogStatus[] = [
  { value: 'all', label: 'All' },
  { value: 'success', label: 'Success' },
  { value: 'failed', label: 'Failed' },
  { value: 'pending', label: 'Pending' },
];

export async function GET() {
  try {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return NextResponse.json(validStatuses, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching audit log statuses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
