import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface SelectionRequest {
  userId: string;
  tierId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SelectionRequest = await request.json();

    // Validate required fields
    if (!body.userId || !body.tierId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json(
      { 
        success: true, 
        message: `Tier ${body.tierId} selected for user ${body.userId}`
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Selection error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
