import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface ExecutionLog {
  id: string;
  executionId: string;
  timestamp: Date;
  action: string;
  details: string;
}

export async function GET() {
  try {
    const logs = await db.executionLog.findMany();
    const executionLogs: ExecutionLog[] = logs.map((log: any) => ({
      id: log.id,
      executionId: log.executionId,
      timestamp: log.timestamp,
      action: log.action,
      details: log.details
    }));
    return NextResponse.json({ data: executionLogs });
  } catch (error) {
    console.error('Error fetching execution logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch execution logs' },
      { status: 500 }
    );
  }
}
