import { NextResponse } from 'next/server';
import { z } from 'zod';

const AISystemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  // Add other required AI system fields
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validate ID format
    const idValidation = z.string().uuid().safeParse(params.id);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: 'Invalid AI system ID format' },
        { status: 400 }
      );
    }

    // Mock database fetch - replace with actual implementation
    const mockSystem = {
      id: params.id,
      name: 'Example AI System',
      description: 'Sample description for demonstration purposes',
    };

    // Validate response structure
    const validation = AISystemSchema.safeParse(mockSystem);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid system data structure' },
        { status: 500 }
      );
    }

    return NextResponse.json(validation.data);
  } catch (error) {
    console.error('[AI_SYSTEM_GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
