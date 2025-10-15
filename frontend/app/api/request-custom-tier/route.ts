import { NextResponse, type NextRequest } from 'next/server';

type RequestBody = {
  userId: string;
  currentTier: string;
  message?: string;
};

export async function POST(request: NextRequest) {
  try {
    // Stub session for build - replace with actual auth in production
    const session = { user: { id: 'stub-user' } };

    // Validate authentication
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate request body
    const body: RequestBody = await request.json();
    if (!body.userId || !body.currentTier) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // In production: Add business logic here
    // Example: Store request in database or send notification

    return NextResponse.json(
      { message: 'Custom tier request submitted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Custom tier request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
