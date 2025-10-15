import { NextResponse } from 'next/server';

interface CustomerTotal {
  id: string;
  name: string;
  totalAssessments: number;
  totalAmount: number;
}

interface ErrorResponse {
  error: string;
}

export async function GET() {
  try {
    // In real implementation, this would connect to a database or external service
    // Mock data for demonstration purposes
    const mockData: CustomerTotal[] = [
      { id: '1', name: 'Customer A', totalAssessments: 5, totalAmount: 2500 },
      { id: '2', name: 'Customer B', totalAssessments: 3, totalAmount: 1500 },
      { id: '3', name: 'Customer C', totalAssessments: 8, totalAmount: 4000 },
    ];

    // Simulate database response delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return NextResponse.json<CustomerTotal[]>(mockData, { status: 200 });
  } catch (error) {
    console.error('[CUSTOMER_TOTALS_ERROR]', error);
    return NextResponse.json<ErrorResponse>({ error: 'Internal server error' }, { status: 500 });
  }
}
