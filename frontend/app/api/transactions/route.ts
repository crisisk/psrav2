import { NextResponse } from 'next/server';

export interface Transaction {
  id: string;
  customerId: string;
  amount: number;
  date: string;
  description: string;
  type: 'payment' | 'refund' | 'adjustment';
}

export async function GET() {
  try {
    // Simulate database fetch with mock data
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        customerId: 'cust-123',
        amount: 150.75,
        date: '2024-03-15',
        description: 'Annual Certification Fee',
        type: 'payment'
      },
      {
        id: '2',
        customerId: 'cust-456',
        amount: 299.0,
        date: '2024-03-14',
        description: 'Product Compliance Audit',
        type: 'payment'
      }
    ];

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({ transactions: mockTransactions });
  } catch (error) {
    console.error('[TRANSACTIONS_API]', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
