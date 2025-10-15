/**
 * Interface representing a partner webhook payload
 */
interface WebhookPayload {
  id: string;
  eventType: 'user.created' | 'order.completed' | 'invoice.paid' | 'ltsd.certificate.generated';
  data: Record<string, unknown>;
  timestamp: string;
}

/**
 * Validation result structure for webhook payloads
 */
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Type for event type values
 */
type EventType = WebhookPayload['eventType'];

/**
 * Validates a partner webhook payload against required schema
 * @param {unknown} payload - The incoming webhook payload
 * @returns {ValidationResult} Validation result with errors array
 */
const validateWebhookPayload = (payload: unknown): ValidationResult => {
  const errors: string[] = [];
  const result: Partial<WebhookPayload> = payload || {};

  if (!result.id) errors.push('Missing required field: id');
  if (!result.eventType) errors.push('Missing required field: eventType');
  if (!result.data) errors.push('Missing required field: data');
  if (!result.timestamp) errors.push('Missing required field: timestamp');

  if (result.eventType && !['user.created', 'order.completed', 'invoice.paid'].includes(result.eventType)) {
    errors.push(`Invalid eventType: ${result.eventType}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Processes a validated webhook payload
 * @param {WebhookPayload} payload - Validated webhook payload
 * @returns {Promise<boolean>} Promise resolving to processing success status
 */
const handleWebhook = async (payload: WebhookPayload): Promise<boolean> => {
  try {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log(`Processed webhook ${payload.id} (${payload.eventType})`);
    return true;
  } catch (error) {
    console.error('Webhook processing failed:', error);
    throw new Error('Webhook processing failed', { cause: error });
  }
};

/**
 * Custom error class for partner webhook errors
 */
export class PartnerWebhookError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = 'PartnerWebhookError';
  }
}

/**
 * Trigger a test webhook for partner integration testing
 * @param {string} partnerId - The partner ID to test
 * @param {EventType} eventType - The type of webhook event to test
 * @returns {Promise<boolean>} Promise resolving to test success status
 */
export async function triggerPartnerWebhookTest(
  partnerId: string,
  eventType: EventType
): Promise<boolean> {
  try {
    const testPayload: WebhookPayload = {
      id: `test-${Date.now()}`,
      eventType,
      data: { partnerId, isTest: true },
      timestamp: new Date().toISOString()
    };

    return await handleWebhook(testPayload);
  } catch (error) {
    throw new PartnerWebhookError('Test webhook failed', 500);
  }
}

export default {
  validateWebhookPayload,
  handleWebhook,
  triggerPartnerWebhookTest
};

export {
  validateWebhookPayload,
  handleWebhook
};

export type {
  WebhookPayload,
  ValidationResult,
  EventType
};

/**
 * Available partner webhook events
 */
export const PARTNER_WEBHOOK_EVENTS = [
  'user.created',
  'order.completed',
  'invoice.paid',
  'ltsd.certificate.generated'
] as const;


/**
 * List all registered partner webhooks
 */
export async function listPartnerWebhooks(partnerId?: string): Promise<any[]> {
  console.log('[Partner Webhooks] List webhooks for:', partnerId || 'all');
  return [];
}


/**
 * Register a new partner webhook
 */
export async function registerPartnerWebhook(
  partnerId: string,
  webhookUrl: string,
  events: string[]
): Promise<{ summary: any, sharedSecret: string }> {
  console.log('[Partner Webhooks] Register:', partnerId, webhookUrl, events);
  const sharedSecret = `secret-${Math.random().toString(36).substring(2, 15)}`;
  const summary = { id: `webhook-${Date.now()}`, partnerId, webhookUrl, events };
  console.log('[Partner Webhooks] Register:', partnerId, webhookUrl, events);
  return { summary, sharedSecret };
}
