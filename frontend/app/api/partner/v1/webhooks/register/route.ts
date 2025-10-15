import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ZodError, z } from 'zod';

import { PARTNER_WEBHOOK_EVENTS, PartnerWebhookError, registerPartnerWebhook } from '@/lib/partner-webhooks';

export const dynamic = 'force-dynamic';

const payloadSchema = z.object({
  partnerName: z.string().min(2).max(120),
  contactEmail: z.string().email(),
  callbackUrl: z.string().url(),
  events: z.array(z.enum(PARTNER_WEBHOOK_EVENTS)).nonempty().max(10),
});

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const payload = payloadSchema.parse(data);
    const { summary, sharedSecret } = await registerPartnerWebhook(
      payload.partnerName,
      payload.callbackUrl,
      payload.events
    );
    return NextResponse.json({ webhook: summary, sharedSecret }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid request body', details: error.issues }, { status: 400 });
    }

    if (error instanceof PartnerWebhookError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error('Unexpected partner webhook registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
