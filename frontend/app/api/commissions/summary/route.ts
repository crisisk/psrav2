import { NextResponse } from 'next/server';

export interface CommissionSummary {
  totalCommissions: number;
  completed: number;
  pending: number;
  averageDurationDays: number;
}

export async function GET() {
  try {
    // In real implementation, replace with actual data source integration
    const mockData: CommissionSummary = {
      totalCommissions: 45,
      completed: 32,
      pending: 13,
      averageDurationDays: 14.5
    };

    return NextResponse.json(mockData, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch commission summary:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
