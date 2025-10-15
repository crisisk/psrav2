import { NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/audit-logs';

export interface CustomerTotal {
  customerId: string;
  customerName: string;
  totalAmount: number;
}

export async function GET() {
  try {
    const auditLogs = await getAuditLogs();

    // Validate required fields
    const invalidLogs = auditLogs.filter(
      (log) => !log.customerId || typeof log.amount !== 'number'
    );
    
    if (invalidLogs.length > 0) {
      return NextResponse.json(
        { error: 'Invalid audit log data format' },
        { status: 500 }
      );
    }

    // Calculate totals using reduce
    const totalsMap = auditLogs.reduce(
      (acc, log) => {
        const key = log.customerId;
        if (!acc[key]) {
          acc[key] = {
            customerId: log.customerId,
            customerName: log.customerName,
            totalAmount: 0,
          };
        }
        acc[key].totalAmount += log.amount;
        return acc;
      },
      {} as Record<string, CustomerTotal>
    );

    return NextResponse.json({
      data: Object.values(totalsMap)
    });

  } catch (error) {
    console.error('[CustomerTotals] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
