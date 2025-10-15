import { NextRequest, NextResponse } from 'next/server';

// Type definitions for API response
export interface AggregatesResponse {
  status: number;
  data?: {
    period: string;
    totalAssessments: number;
    averageScore: number;
    trend: number;
  };
  message?: string;
}

// Valid periods type
type PeriodType = 'week' | 'month' | 'quarter' | 'year';

// Mock data generator for demonstration
const generateMockData = (period: PeriodType) => {
  const now = new Date();
  return {
    period: period.toUpperCase(),
    totalAssessments: Math.floor(Math.random() * 100) + 50,
    averageScore: Math.floor(Math.random() * 40) + 60,
    trend: Math.floor(Math.random() * 20) - 10,
  };
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') as PeriodType;

    // Validate period parameter
    const validPeriods: PeriodType[] = ['week', 'month', 'quarter', 'year'];
    if (!period || !validPeriods.includes(period)) {
      return NextResponse.json<AggregatesResponse>({
        status: 400,
        message: 'Invalid or missing period parameter',
      }, { status: 400 });
    }

    // Simulate data fetch
    const data = generateMockData(period);

    return NextResponse.json<AggregatesResponse>({
      status: 200,
      data,
    });

  } catch (error) {
    console.error('[AGGREGATES_API_ERROR]', error);
    return NextResponse.json<AggregatesResponse>({
      status: 500,
      message: 'Internal server error',
    }, { status: 500 });
  }
}
