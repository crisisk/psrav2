import { NextResponse } from 'next/server';
import { z } from 'zod';

const ActivityLogSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  userId: z.string().uuid(),
  actionType: z.enum(['CREATE', 'UPDATE', 'DELETE']),
  details: z.string(),
  fullDetails: z.string(),
  relatedEntity: z.string(),
  ipAddress: z.string().ip(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validate activity ID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(params.id)) {
      return NextResponse.json(
        { error: 'Invalid activity ID format' },
        { status: 400 }
      );
    }

    // Simulated data fetch - replace with actual data source
    const mockActivity = {
      id: params.id,
      timestamp: '2024-02-20T14:30:00Z',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      actionType: 'UPDATE',
      details: 'Configuration changes',
      fullDetails: 'Detailed log of all configuration modifications...',
      relatedEntity: 'Assessment Config',
      ipAddress: '192.168.1.42',
    };

    // Validate response structure
    const validationResult = ActivityLogSchema.safeParse(mockActivity);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Data validation failed', details: validationResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json(validationResult.data);
  } catch (error) {
    console.error('[ACTIVITY_LOG_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to retrieve full activity log' },
      { status: 500 }
    );
  }
}
