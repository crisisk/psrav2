import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

type PaymentStatus = {
  id: string;
  assessmentId: string;
  amount: number;
  dueDate: Date;
  status: 'paid' | 'pending' | 'overdue';
  reference: string;
};

interface ErrorResponse {
  error: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assessmentId = searchParams.get('assessmentId');

    if (!assessmentId) {
      return NextResponse.json<ErrorResponse>(
        { error: 'Missing assessment ID' },
        { status: 400 }
      );
    }

    // Simulated database response - replace with actual data source
    const mockPayment: PaymentStatus = {
      id: 'PAY-12345',
      assessmentId,
      amount: 2499.99,
      dueDate: new Date('2024-12-31'),
      status: 'pending',
      reference: `INV-${assessmentId}`
    };

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json<PaymentStatus>(mockPayment);
  } catch (error) {
    console.error('[PAYMENTS_STATUS_ERROR]', error);
    return NextResponse.json<ErrorResponse>(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
