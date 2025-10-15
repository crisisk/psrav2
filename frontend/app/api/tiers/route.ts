import { NextResponse } from 'next/server';
import { z } from 'zod';

const TierSchema = z.object({
  id: z.string(),
  name: z.string(),
  requirements: z.array(z.string()),
  priceRange: z.string(),
});

export async function GET() {
  try {
    // Simulated data fetch - replace with actual data source
    const mockTiers = [
      {
        id: '1',
        name: 'Basic',
        requirements: ['Requirement A', 'Requirement B'],
        priceRange: '$0-$500'
      }
    ];

    // Validate response structure
    const validationResult = TierSchema.array().safeParse(mockTiers);
    if (!validationResult.success) {
      console.error('Data validation failed:', validationResult.error);
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 500 }
      );
    }

    return NextResponse.json(validationResult.data);
  } catch (error) {
    console.error('Error fetching tiers:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve tier data' },
      { status: 500 }
    );
  }
}
