import { NextResponse } from 'next/server';
import { getAuditLogs } from '@/lib/audit-logs';

interface CalculationResult {
  totalLogs: number;
  averageDuration: number;
  successPercentage: number;
}

export async function GET() {
  try {
    const logs = await getAuditLogs();

    // Calculate metrics
    const totalLogs = logs.length;
    const totalDuration = logs.reduce((sum, log) => sum + (log.duration || 0), 0);
    const successfulLogs = logs.filter(log => log.success === true).length;

    const calculations: CalculationResult = {
      totalLogs,
      averageDuration: totalLogs > 0 ? Math.round(totalDuration / totalLogs) : 0,
      successPercentage: totalLogs > 0 ? Math.round((successfulLogs / totalLogs) * 100) : 0
    };

    return NextResponse.json(calculations);
  } catch (error) {
    console.error('Calculation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
