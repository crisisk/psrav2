import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { evaluateLtsd, LtsdServiceError } from '@/lib/integrations/ltsd-service';
import { evaluateRequestSchema } from '@/lib/integrations/ltsd-contracts';
import { deepCamelToSnake, deepSnakeToCamel } from '@/lib/utils/case';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const canonicalPayload = evaluateRequestSchema.parse(deepCamelToSnake(rawBody));
    const evaluation = await evaluateLtsd(canonicalPayload);
    const transformed = deepSnakeToCamel(evaluation);
    return NextResponse.json(transformed);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof LtsdServiceError) {
      return NextResponse.json(
        { error: error.message, details: error.details },
        { status: error.status }
      );
    }

    console.error('Unexpected LTSD evaluate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
