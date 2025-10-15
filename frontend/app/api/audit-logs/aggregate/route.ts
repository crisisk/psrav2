import { NextResponse } from 'next/server';
import { z } from 'zod';

const querySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const validation = querySchema.safeParse(rawParams);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors.map(e => e.message) },
        { status: 400 }
      );
    }

    const { period, startDate, endDate } = validation.data;
    
    // Convert to Date objects for database query
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Simulated database query - replace with actual implementation
    const mockData = [
      { period: '2024-01-01', count: 42 },
      { period: '2024-01-02', count: 35 },
    ];

    return NextResponse.json({ data: mockData });

  } catch (error) {
    console.error('Aggregation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
