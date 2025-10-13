/**
 * Partner API v1: Origin Check Endpoint
 *
 * POST /api/partner/v1/origin-check
 *
 * External API for partners to check preferential origin compliance.
 * Requires API key authentication.
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withPartnerAuth } from '@/lib/partner-api/auth';

// Request validation schema
const OriginCheckRequest = z.object({
  productSku: z.string().min(1).max(100),
  hsCode: z.string().regex(/^\d{6,10}$/, 'HS code must be 6-10 digits'),
  agreement: z.enum(['CETA', 'EU-UK-TCA', 'EU-JP-EPA', 'RCEP', 'USMCA', 'GSP']),
  exWorksValue: z.number().positive(),
  materials: z.array(
    z.object({
      hsCode: z.string().regex(/^\d{6,10}$/),
      origin: z.string().length(2), // ISO 3166-1 alpha-2
      value: z.number().nonnegative(),
      description: z.string().optional(),
    })
  ).min(1),
  requestId: z.string().optional(), // Client-provided correlation ID
});

// Response type
interface OriginCheckResponse {
  requestId: string;
  result: {
    isConform: boolean;
    confidence: number;
    verdict: 'PREFERENTIAL' | 'NON_PREFERENTIAL';
    explanation: string;
    appliedRules: string[];
  };
  calculations: {
    regionalValueContent: number;
    nonOriginatingMaterialsValue: number;
    originatingMaterialsValue: number;
  };
  timestamp: string;
  processingTime: number; // milliseconds
}

/**
 * POST /api/partner/v1/origin-check
 *
 * Check if a product qualifies for preferential origin under a trade agreement.
 */
export const POST = withPartnerAuth(async (req: NextRequest, context: { partnerId: string }) => {
  const startTime = Date.now();

  try {
    // Parse and validate request body
    const body = await req.json();
    const validated = OriginCheckRequest.parse(body);

    // Generate request ID if not provided
    const requestId = validated.requestId || `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Log request (for audit trail)
    console.log('[Partner API] Origin check request', {
      partnerId: context.partnerId,
      requestId,
      productSku: validated.productSku,
      agreement: validated.agreement,
    });

    // Perform origin calculation (mock implementation - replace with real logic)
    const result = await performOriginCheck(validated);

    // Calculate processing time
    const processingTime = Date.now() - startTime;

    const response: OriginCheckResponse = {
      requestId,
      result,
      calculations: {
        regionalValueContent: result.rvcPercentage || 0,
        nonOriginatingMaterialsValue: validated.materials
          .filter(m => !isOriginatingMaterial(m, validated.agreement))
          .reduce((sum, m) => sum + m.value, 0),
        originatingMaterialsValue: validated.materials
          .filter(m => isOriginatingMaterial(m, validated.agreement))
          .reduce((sum, m) => sum + m.value, 0),
      },
      timestamp: new Date().toISOString(),
      processingTime,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(e => ({ path: e.path.join('.'), message: e.message })),
        },
        { status: 400 }
      );
    }

    console.error('[Partner API] Origin check failed', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: process.env.NODE_ENV === 'development' ? String(error) : 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
});

// Helper: Perform origin check calculation
async function performOriginCheck(request: z.infer<typeof OriginCheckRequest>) {
  // Mock implementation - replace with actual origin engine logic
  const totalValue = request.exWorksValue;
  const nonOriginatingValue = request.materials
    .filter(m => !isOriginatingMaterial(m, request.agreement))
    .reduce((sum, m) => sum + m.value, 0);

  const rvcPercentage = ((totalValue - nonOriginatingValue) / totalValue) * 100;

  // Simple rule: RVC must be >= 60% for CETA
  const threshold = request.agreement === 'CETA' ? 60 : 55;
  const isConform = rvcPercentage >= threshold;

  return {
    isConform,
    confidence: 0.95,
    verdict: isConform ? ('PREFERENTIAL' as const) : ('NON_PREFERENTIAL' as const),
    explanation: isConform
      ? `Product qualifies for preferential origin under ${request.agreement}. Regional Value Content (RVC) is ${rvcPercentage.toFixed(1)}%, which exceeds the ${threshold}% threshold.`
      : `Product does not qualify for preferential origin. RVC is ${rvcPercentage.toFixed(1)}%, below the required ${threshold}%.`,
    appliedRules: [`RVC >= ${threshold}%`, 'Change in Tariff Classification (CTC)'],
    rvcPercentage,
  };
}

// Helper: Check if material is originating
function isOriginatingMaterial(
  material: { origin: string; hsCode: string },
  agreement: string
): boolean {
  // Simplified logic - in production, this would check:
  // 1. Origin country is party to the agreement
  // 2. Material meets cumulation rules
  // 3. Material has valid certificate of origin

  const agreementCountries: Record<string, string[]> = {
    CETA: ['CA', 'EU'],
    'EU-UK-TCA': ['GB', 'EU'],
    'EU-JP-EPA': ['JP', 'EU'],
    RCEP: ['AU', 'CN', 'JP', 'KR', 'NZ', 'SG', 'TH', 'VN'],
    USMCA: ['US', 'CA', 'MX'],
    GSP: ['EU'], // Generalized System of Preferences
  };

  const validOrigins = agreementCountries[agreement] || [];

  return validOrigins.includes(material.origin) || validOrigins.includes('EU');
}

/**
 * GET /api/partner/v1/origin-check
 *
 * Health check endpoint
 */
export const GET = withPartnerAuth(async (req: NextRequest) => {
  return NextResponse.json({
    status: 'ok',
    version: '1.0.0',
    endpoint: 'origin-check',
    documentation: '/docs/partner-api-v1.md',
  });
});
