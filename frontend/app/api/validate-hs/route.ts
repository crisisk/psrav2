import { NextRequest, NextResponse } from 'next/server';

interface ValidationRequest {
  hsCode: string;
  weight: number;
}

interface ValidationResponse {
  success: boolean;
  errors?: {
    hsCode?: string;
    weight?: string;
  };
}

export async function POST(req: NextRequest) {
  try {
    // Verify request method
    if (req.method !== 'POST') {
      return NextResponse.json(
        { success: false, errors: { hsCode: 'Invalid method' } },
        { status: 405 }
      );
    }

    // Parse and validate request body
    const body = (await req.json()) as Partial<ValidationRequest>;
    
    if (!body.hsCode || !body.weight) {
      return NextResponse.json(
        { success: false, errors: { hsCode: 'Missing required fields' } },
        { status: 400 }
      );
    }

    const errors: ValidationResponse['errors'] = {};

    // HS Code validation (6 digits)
    const hsCodePattern = /^\d{6}$/;
    if (!hsCodePattern.test(body.hsCode)) {
      errors.hsCode = 'HS Code must be 6 digits';
    }

    // Weight validation (1-100000 kg)
    if (typeof body.weight !== 'number' || body.weight < 1 || body.weight > 100000) {
      errors.weight = 'Weight must be between 1 and 100,000 kg';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true },
      { status: 200 }
    );

  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { success: false, errors: { hsCode: 'Server error' } },
      { status: 500 }
    );
  }
}
