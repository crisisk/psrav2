/**
 * API Proxy & Mock Data Library
 * Handles proxying to backend or serving mock data
 */

import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.API_BASE_URL || '';

/**
 * Check if we should use mock data
 */
export function shouldUseMock(): boolean {
  return !API_BASE_URL || process.env.NEXT_PUBLIC_MOCK_DATA === 'true';
}

/**
 * Proxy a request to the backend API
 */
export async function proxyRequest(
  request: NextRequest,
  path: string,
  options?: RequestInit
): Promise<NextResponse> {
  if (shouldUseMock()) {
    return NextResponse.json(
      { error: 'No API_BASE_URL configured - use mock data' },
      { status: 503 }
    );
  }

  try {
    const url = `${API_BASE_URL}${path}`;
    const headers = new Headers(options?.headers || {});
    
    // Forward authorization headers
    const authHeader = request.headers.get('Authorization');
    if (authHeader) {
      headers.set('Authorization', authHeader);
    }

    // Forward role header (demo mode)
    const roleHeader = request.headers.get('X-Role');
    if (roleHeader) {
      headers.set('X-Role', roleHeader);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error(`[API Proxy] Error proxying to ${path}:`, error);
    return NextResponse.json(
      { error: 'Failed to proxy request' },
      { status: 502 }
    );
  }
}

/**
 * Generate mock assessment data
 */
export function mockAssessments() {
  return [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      ltsdId: '550e8400-e29b-41d4-a716-446655440011',
      hsCode: '8517.12.00',
      productName: 'Smartphones met touchscreen',
      verdict: 'GO',
      status: 'COMPLETED',
      agreement: 'EU-Japan EPA',
      confidence: 0.92,
      createdAt: '2025-10-12T10:30:00Z',
      updatedAt: '2025-10-12T11:45:00Z',
      completedAt: '2025-10-12T11:45:00Z',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      ltsdId: '550e8400-e29b-41d4-a716-446655440012',
      hsCode: '6203.42.11',
      productName: 'Katoenen werkbroeken',
      verdict: 'NO_GO',
      status: 'COMPLETED',
      agreement: 'CETA',
      confidence: 0.78,
      createdAt: '2025-10-11T14:20:00Z',
      updatedAt: '2025-10-11T15:10:00Z',
      completedAt: '2025-10-11T15:10:00Z',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      ltsdId: '550e8400-e29b-41d4-a716-446655440013',
      hsCode: '7326.90.98',
      productName: 'Stalen schroeven & bevestigingsmaterialen',
      verdict: 'GO',
      status: 'COMPLETED',
      agreement: 'EU-South Korea FTA',
      confidence: 0.88,
      createdAt: '2025-10-10T09:15:00Z',
      updatedAt: '2025-10-10T10:30:00Z',
      completedAt: '2025-10-10T10:30:00Z',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      ltsdId: '550e8400-e29b-41d4-a716-446655440014',
      hsCode: '8471.30.00',
      productName: 'Draagbare computers (laptops)',
      verdict: 'PENDING',
      status: 'IN_PROGRESS',
      agreement: 'EU-Vietnam FTA',
      createdAt: '2025-10-13T08:00:00Z',
      updatedAt: '2025-10-13T08:30:00Z',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440005',
      ltsdId: '550e8400-e29b-41d4-a716-446655440015',
      hsCode: '3926.90.97',
      productName: 'Plastic onderdelen (diverse)',
      verdict: 'GO',
      status: 'COMPLETED',
      agreement: 'EU-Mexico FTA',
      confidence: 0.85,
      createdAt: '2025-10-09T13:45:00Z',
      updatedAt: '2025-10-09T14:50:00Z',
      completedAt: '2025-10-09T14:50:00Z',
    },
  ];
}

/**
 * Generate mock insights data
 */
export function mockInsights() {
  return {
    p95Latency: 1250,
    passFailLast7d: {
      pass: 47,
      fail: 8,
    },
    exceptionsOpen: 3,
    ltsdDueSoon: 12,
  };
}

/**
 * Generate mock CFO KPIs
 */
export function mockCfoKpis() {
  return {
    savingsMtd: 1245000,
    atRisk: 85000,
    avgDecisionTime: 4200,
    openApprovals: 3,
  };
}

/**
 * Generate mock CFO trend data
 */
export function mockCfoTrend() {
  return [
    { date: '2025-10-07', pass: 8, fail: 1, savings: 98000 },
    { date: '2025-10-08', pass: 12, fail: 2, savings: 145000 },
    { date: '2025-10-09', pass: 9, fail: 0, savings: 112000 },
    { date: '2025-10-10', pass: 11, fail: 3, savings: 134000 },
    { date: '2025-10-11', pass: 7, fail: 2, savings: 89000 },
    { date: '2025-10-12', pass: 10, fail: 0, savings: 156000 },
    { date: '2025-10-13', pass: 5, fail: 0, savings: 67000 },
  ];
}

/**
 * Generate mock savings by agreement
 */
export function mockSavingsByAgreement() {
  return [
    { agreement: 'EU-Japan EPA', savings: 487000, count: 15 },
    { agreement: 'CETA', savings: 312000, count: 9 },
    { agreement: 'EU-South Korea FTA', savings: 245000, count: 12 },
    { agreement: 'EU-Vietnam FTA', savings: 156000, count: 7 },
    { agreement: 'EU-Mexico FTA', savings: 45000, count: 4 },
  ];
}

/**
 * Generate mock at-risk data
 */
export function mockAtRisk() {
  return [
    {
      id: '550e8400-e29b-41d4-a716-446655440021',
      ltsdId: '550e8400-e29b-41d4-a716-446655440012',
      product: 'Katoenen werkbroeken',
      risk: 'HIGH' as const,
      value: 45000,
      reason: 'Insufficient value-add documentation',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440022',
      ltsdId: '550e8400-e29b-41d4-a716-446655440016',
      product: 'Textielcomponenten diverse',
      risk: 'MEDIUM' as const,
      value: 28000,
      reason: 'Missing CoO for 2 BOM nodes',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440023',
      ltsdId: '550e8400-e29b-41d4-a716-446655440017',
      product: 'Elektronische printplaten',
      risk: 'MEDIUM' as const,
      value: 12000,
      reason: 'HS classification review pending',
    },
  ];
}

/**
 * Generate mock approvals data
 */
export function mockApprovals() {
  return [
    {
      id: '550e8400-e29b-41d4-a716-446655440031',
      supplier: 'Acme Industries BV',
      product: 'Stalen componenten (schroeven, bouten)',
      value: 125000,
      risk: 'LOW' as const,
      submittedAt: '2025-10-12T14:30:00Z',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440032',
      supplier: 'Global Textiles Ltd',
      product: 'Stoffen & materialen (katoen)',
      value: 89000,
      risk: 'MEDIUM' as const,
      submittedAt: '2025-10-11T09:15:00Z',
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440033',
      supplier: 'Tech Solutions GmbH',
      product: 'Elektronische onderdelen (IC\'s, printplaten)',
      value: 234000,
      risk: 'LOW' as const,
      submittedAt: '2025-10-10T16:45:00Z',
    },
  ];
}

/**
 * Generate mock chain overview
 */
export function mockChainOverview(ltsdId: string) {
  return {
    ltsdId,
    status: 'INCOMPLETE' as const,
    coveragePercent: 75,
    totalNodes: 8,
    nodesWithCoo: 6,
    rootNode: {
      id: '550e8400-e29b-41d4-a716-446655440041',
      hsCode: '8517.12.00',
      description: 'Smartphone (eindproduct)',
      originCountry: 'NL',
      hasCoo: true,
      cooDocumentId: '550e8400-e29b-41d4-a716-446655440051',
      children: [
        {
          id: '550e8400-e29b-41d4-a716-446655440042',
          hsCode: '8542.31.00',
          description: 'Processor chip (Qualcomm)',
          originCountry: 'US',
          hasCoo: true,
          cooDocumentId: '550e8400-e29b-41d4-a716-446655440052',
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440043',
          hsCode: '8541.10.00',
          description: 'Display panel (OLED)',
          originCountry: 'KR',
          hasCoo: true,
          cooDocumentId: '550e8400-e29b-41d4-a716-446655440053',
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440044',
          description: 'Plastic behuizing',
          originCountry: 'CN',
          hasCoo: false,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440045',
          description: 'Batterij (Li-ion)',
          originCountry: 'CN',
          hasCoo: false,
        },
      ],
    },
  };
}

/**
 * Generate mock XAI explanation
 */
export function mockXaiExplanation(assessmentId: string) {
  return {
    assessmentId,
    verdict: 'GO' as const,
    summary: 'Product kwalificeert voor preferentiële oorsprong onder EU-Japan EPA via Change of Tariff Heading (CTH) regel. Alle materiaalketen-documenten zijn compleet.',
    rulePath: {
      agreement: 'EU-Japan EPA',
      rule: 'CTH' as const,
      checkpoints: [
        {
          name: 'HS Code Validation',
          status: 'PASS' as const,
          rationale: 'HS code 8517.12.00 is geldig en correct geclassificeerd voor smartphones met touchscreen.',
        },
        {
          name: 'CTH Compliance',
          status: 'PASS' as const,
          rationale: 'Tariff heading change van 8542 (processors) naar 8517 (telecommunicatie) voldoet aan CTH-eis.',
        },
        {
          name: 'Value-Add Threshold',
          status: 'PASS' as const,
          rationale: 'EU value-add van 58% overschrijdt minimum 45% drempel (EU-Japan EPA Article 3.2).',
        },
        {
          name: 'Chain of Custody',
          status: 'WARN' as const,
          rationale: 'Alle kritieke BOM nodes hebben CoO, maar 2 minor componenten (behuizing, batterij) missen documentatie.',
        },
        {
          name: 'Cumulation Rules',
          status: 'PASS' as const,
          rationale: 'Bilateral cumulation met Japan toegepast voor processor componenten (Article 3.5).',
        },
      ],
    },
    chainClosure: {
      coveragePercent: 92,
      missingNodes: ['Plastic behuizing', 'Batterij (Li-ion)'],
    },
    dataInputs: {
      hsCode: '8517.12.00',
      bomNodes: 8,
      cooDocuments: 6,
    },
    trace: {
      traceId: 'trace-550e8400-e29b-41d4-a716-446655440001',
      duration: 1247,
      confidence: 0.92,
    },
  };
}
