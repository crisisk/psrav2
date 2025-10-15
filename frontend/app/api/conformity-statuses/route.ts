import { NextResponse } from 'next/server';

// Type definition for status options
type StatusOption = {
  value: string;
  label: string;
};

export async function GET() {
  try {
    // Simulate API response with static status options
    const statusOptions: StatusOption[] = [
      { value: 'all', label: 'All' },
      { value: 'pending', label: 'Pending' },
      { value: 'approved', label: 'Approved' },
      { value: 'rejected', label: 'Rejected' },
      { value: 'in-review', label: 'In Review' },
    ];

    return NextResponse.json(
      { success: true, data: statusOptions },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch status options',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
