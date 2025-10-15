import { NextResponse } from 'next/server';

interface RevenueData {
  timestamp: string;
  amount: number;
}

interface ApiResponse {
  data: RevenueData[];
  interval: string;
  currency: string;
}

interface ErrorResponse {
  error: string;
}

export async function GET() {
  try {
    // Simulate async data fetch
    const mockData: RevenueData[] = [
      { timestamp: '2024-01', amount: 2500 },
      { timestamp: '2024-02', amount: 3200 },
      { timestamp: '2024-03', amount: 2900 },
      { timestamp: '2024-04', amount: 4100 },
    ];

    const response: ApiResponse = {
      data: mockData,
      interval: 'monthly',
      currency: 'USD',
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const errorResponse: ErrorResponse = {
      error: 'Failed to fetch revenue data',
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
