import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface RejectRequest {
  ids: string[];
}

interface ErrorResponse {
  error: string;
}

export async function POST(request: NextRequest) {
  try {
    // Validate request method
    if (request.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
    }

    // Validate authentication (simulated)
    const sessionToken = request.cookies.get('sessionToken')?.value;
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body: RejectRequest = await request.json();
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Simulate database update
    const mockUpdateResult = {
      success: true,
      rejectedCount: body.ids.length
    };

    if (!mockUpdateResult.success) {
      throw new Error('Database update failed');
    }

    return NextResponse.json({
      message: `Successfully rejected ${mockUpdateResult.rejectedCount} entries`
    });

  } catch (error) {
    console.error('[AUDIT_LOG_REJECT] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
