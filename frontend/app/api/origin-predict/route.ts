import { NextResponse } from 'next/server';

// Type definitions for prediction request/response
interface PredictRequest {
  text: string;
}

interface PredictResponse {
  origin: string;
  confidence: number;
  timestamp: string;
}

// Mock model prediction (replace with actual model integration)
const mockPredictOrigin = (text: string): PredictResponse => ({
  origin: ['Internal', 'External'][Math.floor(Math.random() * 2)],
  confidence: Math.random(),
  timestamp: new Date().toISOString(),
});

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 415 }
      );
    }

    const body = (await request.json()) as PredictRequest;
    
    // Input validation
    if (!body.text || typeof body.text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid text input' },
        { status: 400 }
      );
    }

    // Simulate model prediction
    const prediction = mockPredictOrigin(body.text);

    return NextResponse.json<PredictResponse>(prediction, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Prediction error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
