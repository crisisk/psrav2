import { NextRequest, NextResponse } from 'next/server';

interface BackRequest {
  fromPage: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: BackRequest = await request.json();

    if (!body.fromPage || typeof body.fromPage !== 'string') {
      return NextResponse.json(
        { error: 'Missing required field: fromPage' },
        { status: 400 }
      );
    }

    // In production: Add your tracking logic here (e.g., database log, analytics)
    console.log(`Back navigation tracked from: ${body.fromPage}`);

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing back action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
