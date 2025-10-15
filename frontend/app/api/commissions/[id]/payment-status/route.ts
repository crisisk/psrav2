import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface CommissionPaymentStatus {
  isPaid: boolean;
  commissionId: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validate commission ID
    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Invalid commission ID' },
        { status: 400 }
      );
    }

    // Mock database check - replace with actual database call
    const isPaid = await checkCommissionPaymentStatus(id);

    return NextResponse.json<CommissionPaymentStatus>({
      isPaid,
      commissionId: id
    });

  } catch (error) {
    console.error('Payment status check failed:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve payment status' },
      { status: 500 }
    );
  }
}

// Mock payment status verification - replace with real database query
async function checkCommissionPaymentStatus(id: string): Promise<boolean> {
  // Simulate database lookup
  const paidCommissions = ['123', '456'];
  return paidCommissions.includes(id);
}