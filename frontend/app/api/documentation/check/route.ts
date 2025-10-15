import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface CheckResponse {
  success: boolean;
  message?: string;
  exists: boolean;
}

// Mock database check for documentation existence
const checkDocumentationExists = async (assessmentId: string): Promise<boolean> => {
  // In real implementation, this would query your database
  return assessmentId.startsWith('CA-'); // Mock validation logic
};

export async function GET(request: NextRequest) {
  try {
    const assessmentId = request.nextUrl.searchParams.get('assessmentId');

    // Validate input
    if (!assessmentId) {
      return NextResponse.json<CheckResponse>({
        success: false,
        message: 'Missing assessment ID',
        exists: false
      }, { status: 400 });
    }

    // Check documentation status
    const exists = await checkDocumentationExists(assessmentId);

    return NextResponse.json<CheckResponse>({
      success: true,
      exists
    });

  } catch (error) {
    console.error('[DocumentationCheck] Error:', error);
    return NextResponse.json<CheckResponse>({
      success: false,
      message: 'Internal server error',
      exists: false
    }, { status: 500 });
  }
}
