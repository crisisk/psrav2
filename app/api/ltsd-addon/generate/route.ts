import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { generateLtsdCertificate, LtsdServiceError } from '@/lib/integrations/ltsd-service';
import { generateCertificateRequestSchema } from '@/lib/integrations/ltsd-contracts';
import { deepCamelToSnake } from '@/lib/utils/case';

export const dynamic = 'force-dynamic';

const PASSTHROUGH_HEADERS = [
  'content-type',
  'content-disposition',
  'x-notary-hash',
  'x-ledger-reference',
];

export async function POST(request: NextRequest) {
  try {
    const payload = generateCertificateRequestSchema.parse(deepCamelToSnake(await request.json()));
    const response = await generateLtsdCertificate(payload);

    if (!response.body) {
      throw new LtsdServiceError('LTSD service returned an empty response body', 502);
    }

    const headers = new Headers();
    for (const header of PASSTHROUGH_HEADERS) {
      const value = response.headers.get(header);
      if (value) {
        headers.set(header, value);
      }
    }

    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/pdf');
    }

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
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

    console.error('Unexpected LTSD generate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
