import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // TODO: Validate input
    // TODO: Implement actual database creation

    const created = {
      id: `new-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('[API Error] POST /api/v1/partners/resources/request:', error);
    return NextResponse.json(
      { error: 'Failed to create request' },
      { status: 500 }
    );
  }
}
