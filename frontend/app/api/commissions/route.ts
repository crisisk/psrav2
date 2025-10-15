import { NextResponse } from 'next/server';

// Type definition for commission report
export interface CommissionReport {
  id: string;
  agentName: string;
  policyNumber: string;
  commissionAmount: number;
  calculationDate: string;
  status: 'pending' | 'paid' | 'rejected';
}

// Mock data - replace with actual database connection
const mockCommissionData: CommissionReport[] = [
  {
    id: '1',
    agentName: 'John Doe',
    policyNumber: 'POL123456',
    commissionAmount: 2450.75,
    calculationDate: '2024-03-15',
    status: 'paid',
  },
  {
    id: '2',
    agentName: 'Jane Smith',
    policyNumber: 'POL789012',
    commissionAmount: 1895.5,
    calculationDate: '2024-03-14',
    status: 'pending',
  },
];

export async function GET() {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In real implementation, add:
    // - Authentication/authorization check
    // - Database query
    // - Pagination
    // - Filtering

    return NextResponse.json({
      status: 200,
      data: mockCommissionData,
      message: 'Commission reports retrieved successfully',
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({
      status: 500,
      message: `Failed to retrieve commission reports: ${errorMessage}`,
      data: [],
    }, { status: 500 });
  }
}
