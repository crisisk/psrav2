import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { ZodError, z } from 'zod';

import { PARTNER_WEBHOOK_EVENTS, PartnerWebhookError, triggerPartnerWebhookTest } from '@/lib/partner-webhooks';

export const dynamic = 'force-dynamic';

const payloadSchema = z.object({
  webhookId: z.string().uuid(),
  eventType: z.enum(PARTNER_WEBHOOK_EVENTS).default('ltsd.certificate.generated'),
});

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const payload = payloadSchema.parse(data);
    const result = await triggerPartnerWebhookTest(payload.webhookId, payload.eventType);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid request body', details: error.issues }, { status: 400 });
    }

    if (error instanceof PartnerWebhookError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error('Unexpected partner webhook test error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
