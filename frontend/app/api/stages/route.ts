import { NextResponse } from 'next/server';

// Mock data for demonstration purposes
const MOCK_STAGES = [
  'Initial Assessment',
  'Testing Phase',
  'Final Review',
  'Certification'
];

export async function GET() {
  try {
    // In a real implementation, this would fetch from a database
    return NextResponse.json(
      { stages: ['all', ...MOCK_STAGES] },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch stages' },
      { status: 500 }
    );
  }
}
