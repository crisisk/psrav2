import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { listPartnerWebhooks } from '@/lib/partner-webhooks';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  const webhooks = await listPartnerWebhooks();
  return NextResponse.json({ items: webhooks, total: webhooks.length });
}
