/**
 * Partner API v1: Webhook Management Endpoint
 *
 * POST /api/partner/v1/webhook - Register webhook
 * GET  /api/partner/v1/webhook - List webhooks
 * DELETE /api/partner/v1/webhook - Delete webhook
 *
 * Allows partners to register webhooks for asynchronous notifications.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withPartnerAuth } from '@/lib/partner-api/auth';

// Event types for webhooks
const WebhookEventTypes = [
  'origin.checked',
  'certificate.generated',
  'certificate.expired',
  'ltsd.validated',
  'ltsd.rejected',
] as const;

// Webhook registration schema
const WebhookRegistrationSchema = z.object({
  url: z.string().url().startsWith('https://', 'Webhook URL must use HTTPS'),
  events: z.array(z.enum(WebhookEventTypes)).min(1, 'At least one event type is required'),
  secret: z.string().min(32, 'Secret must be at least 32 characters for security'),
  description: z.string().max(255).optional(),
});

interface Webhook {
  id: string;
  partnerId: string;
  url: string;
  events: string[];
  secret: string; // Never returned in API responses
  description?: string;
  active: boolean;
  createdAt: string;
  lastDeliveryAt?: string;
  deliveryStats: {
    total: number;
    successful: number;
    failed: number;
  };
}

/**
 * POST /api/partner/v1/webhook
 *
 * Register a new webhook for event notifications
 */
export const POST = withPartnerAuth(async (req: NextRequest, context: { partnerId: string }) => {
  try {
    const body = await req.json();
    const validated = WebhookRegistrationSchema.parse(body);

    console.log('[Partner API] Webhook registration', {
      partnerId: context.partnerId,
      url: validated.url,
      events: validated.events,
    });

    // Create webhook (mock implementation - replace with DB insert)
    const webhook = await createWebhook(context.partnerId, validated);

    return NextResponse.json(
      {
        webhook: {
          id: webhook.id,
          url: webhook.url,
          events: webhook.events,
          description: webhook.description,
          active: webhook.active,
          createdAt: webhook.createdAt,
        },
        message: 'Webhook registered successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid webhook configuration',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
        },
        { status: 400 }
      );
    }

    console.error('[Partner API] Webhook registration failed', error);

    return NextResponse.json(
      {
        error: 'Failed to register webhook',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
});

/**
 * GET /api/partner/v1/webhook
 *
 * List all registered webhooks for the partner
 */
export const GET = withPartnerAuth(async (req: NextRequest, context: { partnerId: string }) => {
  try {
    // Fetch webhooks for partner (mock implementation)
    const webhooks = await fetchWebhooks(context.partnerId);

    return NextResponse.json({
      webhooks: webhooks.map(w => ({
        id: w.id,
        url: w.url,
        events: w.events,
        description: w.description,
        active: w.active,
        createdAt: w.createdAt,
        lastDeliveryAt: w.lastDeliveryAt,
        deliveryStats: w.deliveryStats,
      })),
      total: webhooks.length,
    });
  } catch (error) {
    console.error('[Partner API] Webhook listing failed', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch webhooks',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/partner/v1/webhook
 *
 * Delete a webhook by ID
 */
export const DELETE = withPartnerAuth(async (req: NextRequest, context: { partnerId: string }) => {
  try {
    const { searchParams } = new URL(req.url);
    const webhookId = searchParams.get('id');

    if (!webhookId) {
      return NextResponse.json(
        {
          error: 'Missing webhook ID',
          code: 'MISSING_ID',
        },
        { status: 400 }
      );
    }

    // Delete webhook (mock implementation)
    const deleted = await deleteWebhook(webhookId, context.partnerId);

    if (!deleted) {
      return NextResponse.json(
        {
          error: 'Webhook not found or access denied',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Webhook deleted successfully',
      id: webhookId,
    });
  } catch (error) {
    console.error('[Partner API] Webhook deletion failed', error);

    return NextResponse.json(
      {
        error: 'Failed to delete webhook',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
});

// Helper: Create webhook
async function createWebhook(partnerId: string, data: z.infer<typeof WebhookRegistrationSchema>): Promise<Webhook> {
  // Mock implementation - replace with actual DB insert
  const webhookId = `wh_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  return {
    id: webhookId,
    partnerId,
    url: data.url,
    events: data.events,
    secret: data.secret,
    description: data.description,
    active: true,
    createdAt: new Date().toISOString(),
    deliveryStats: {
      total: 0,
      successful: 0,
      failed: 0,
    },
  };
}

// Helper: Fetch webhooks for partner
async function fetchWebhooks(partnerId: string): Promise<Webhook[]> {
  // Mock implementation - replace with actual DB query
  return [];
}

// Helper: Delete webhook
async function deleteWebhook(webhookId: string, partnerId: string): Promise<boolean> {
  // Mock implementation - replace with actual DB delete
  // Should verify webhook belongs to partner before deleting
  return true;
}
