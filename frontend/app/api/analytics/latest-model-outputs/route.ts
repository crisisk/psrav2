import { NextResponse, type NextRequest } from 'next/server';

/**
 * Represents a single model output record
 */
export interface ModelOutput {
  id: string;
  modelName: string;
  outputData: Record<string, unknown>;
  timestamp: Date;
  userId: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Validate and parse limit parameter
    const rawLimit = searchParams.get('limit') ?? '10';
    const limit = Math.min(Math.max(parseInt(rawLimit) || 10, 1), 100);

    // Simulate data fetching - replace with actual database/API call
    const mockData: ModelOutput[] = Array.from({ length: limit }, (_, i) => ({
      id: `output_${i + 1}`,
      modelName: `model-v${i % 3 + 1}`,
      outputData: { prediction: Math.random() },
      timestamp: new Date(Date.now() - i * 3600000),
      userId: `user_${i % 5 + 1}`
    }));

    return NextResponse.json({
      success: true,
      data: mockData,
      count: mockData.length
    }, { status: 200 });

  } catch (error) {
    console.error('[ANALYTICS_API_ERROR]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve model outputs' },
      { status: 500 }
    );
  }
}
