import { NextRequest, NextResponse } from 'next/server';
import { validateDate } from '@/lib/date-utils';

type HistoricalData = {
  timestamp: string;
  complianceLevel: number;
  assessmentsCount: number;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Validate query parameters
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing date parameters' },
        { status: 400 }
      );
    }

    if (!validateDate(startDate) || !validateDate(endDate)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Mock data - replace with actual database query
    const mockData: HistoricalData[] = Array.from({ length: 12 }).map((_, i) => ({
      timestamp: new Date(2024, i).toISOString(),
      complianceLevel: Math.floor(Math.random() * 40 + 60),
      assessmentsCount: Math.floor(Math.random() * 50 + 20)
    }));

    return NextResponse.json({ data: mockData });
  } catch (error) {
    console.error('[HISTORICAL_TRENDS_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch historical data' },
      { status: 500 }
    );
  }
}
