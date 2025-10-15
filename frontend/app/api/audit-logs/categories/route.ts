import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Simulated data source - replace with actual database query in production
    const categories = [
      { id: 'all', name: 'All' },
      { id: 'user', name: 'User Actions' },
      { id: 'system', name: 'System Events' },
      { id: 'security', name: 'Security' },
    ];

    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch audit log categories' },
      { status: 500 }
    );
  }
}
