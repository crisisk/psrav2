import { NextResponse, type NextRequest } from 'next/server';

interface PaymentStatus {
  id: string;
  logId: string;
  amount: number;
  currency: string;
  status: 'success' | 'pending' | 'failed';
  timestamp: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const logId = searchParams.get('logId');

    // Validate required parameter
    if (!logId) {
      return NextResponse.json(
        { error: 'Missing logId parameter' },
        { status: 400 }
      );
    }

    // Simulate database lookup - replace with actual data source
    const mockStatus: PaymentStatus = {
      id: 'PAY-12345',
      logId,
      amount: 2999,
      currency: 'USD',
      status: 'success',
      timestamp: '2024-02-20T15:30:00Z'
    };

    // Simulate not found scenario
    if (logId === 'invalid-id') {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'success',
      data: mockStatus
    });

  } catch (error) {
    console.error('[PAYMENTS_API_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
