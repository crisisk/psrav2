import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getCertificateById } from '@/lib/repository';

const paramsSchema = z.object({
  id: z.string().min(1).max(128),
});

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = paramsSchema.parse(context.params);
    const certificate = await getCertificateById(id);

    if (!certificate) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
    }

    return NextResponse.json(certificate);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid certificate identifier', details: error.issues }, { status: 400 });
    }

    console.error('Unexpected certificate lookup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
