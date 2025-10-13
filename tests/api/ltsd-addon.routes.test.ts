import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/config', async () => {
  const actual = await vi.importActual<typeof import('@/lib/config')>('@/lib/config');
  return {
    ...actual,
    config: {
      ...actual.config,
      ltsdServiceUrl: 'http://ltsd.test',
      ltsdServiceTimeoutMs: 5000,
    },
    isLtsdServiceConfigured: true,
  };
});

import { POST as evaluateHandler } from '@/app/api/ltsd-addon/evaluate/route';
import { POST as generateHandler } from '@/app/api/ltsd-addon/generate/route';
import { GET as certificateHandler } from '@/app/api/certificates/[id]/route';
import * as repository from '@/lib/repository';

const evaluationPayload = {
  ruleId: 'EU-HS39-001',
  evaluationInput: {
    context: {
      tenantId: '11111111-1111-1111-1111-111111111111',
      requestId: '22222222-2222-2222-2222-222222222222',
      agreement: {
        code: 'CETA',
        name: 'Comprehensive Economic and Trade Agreement',
      },
      hsCode: {
        chapter: '39',
        heading: '3901',
        subheading: '390110',
      },
      effectiveDate: '2025-01-01',
      importCountry: 'NL',
      exportCountry: 'CA',
    },
    billOfMaterials: [
      {
        lineId: 'LINE-1',
        description: 'Polymer pellets',
        hsCode: '390110',
        countryOfOrigin: 'NL',
        value: {
          amount: 1200.5,
          currency: 'EUR',
        },
        isOriginating: true,
      },
    ],
    process: {
      performedOperations: [
        {
          code: 'EXTRUSION',
          performedAt: '2025-01-02T08:30:00Z',
          location: 'NL',
        },
      ],
      totalManufacturingCost: {
        amount: 2200.75,
        currency: 'EUR',
      },
      valueAddedPercentage: 58.5,
    },
    documentation: {
      submittedCertificates: ['EUR-MED'],
      evidence: {
        invoice: 'INV-2025-0001',
      },
    },
  },
};

const evaluationResponse = {
  evaluation: {
    verdict: {
      evaluation_id: '33333333-3333-3333-3333-333333333333',
      rule_id: 'EU-HS39-001',
      status: 'qualified',
      decided_at: '2025-01-02T08:30:01Z',
      confidence: 0.92,
      citations: [
        {
          reference: 'CETA Article 403',
          section: '403.2',
          url: 'https://example.com/ceta/article403',
        },
      ],
      disqualification_reasons: [],
      ledger_reference: 'ledger://evaluation/abc123',
    },
  },
  ledger_reference: 'ledger://evaluation/abc123',
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('POST /api/ltsd-addon/evaluate', () => {
  it('translates camelCase payloads and returns camelCase response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(evaluationResponse), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const request = new NextRequest('http://localhost/api/ltsd-addon/evaluate', {
      method: 'POST',
      body: JSON.stringify(evaluationPayload),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await evaluateHandler(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ledgerReference).toBe('ledger://evaluation/abc123');
    expect(body.evaluation.verdict.evaluationId).toBe('33333333-3333-3333-3333-333333333333');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://ltsd.test/evaluate');
    expect(init?.method).toBe('POST');
    expect(typeof init?.body).toBe('string');
    expect(init?.headers).toMatchObject({
      Accept: 'application/json',
      'Content-Type': 'application/json',
    });

    const parsedPayload = JSON.parse(String(init?.body));
    expect(parsedPayload).toHaveProperty('rule_id', 'EU-HS39-001');
    expect(parsedPayload.evaluation_input).toHaveProperty('bill_of_materials');
  });

  it('returns validation errors for malformed payloads', async () => {
    const request = new NextRequest('http://localhost/api/ltsd-addon/evaluate', {
      method: 'POST',
      body: JSON.stringify({ ruleId: 'invalid' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await evaluateHandler(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid request body');
  });

  it('propagates LTSD service errors', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: 'rule_not_found' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const request = new NextRequest('http://localhost/api/ltsd-addon/evaluate', {
      method: 'POST',
      body: JSON.stringify(evaluationPayload),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await evaluateHandler(request);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('rule_not_found');
  });
});

describe('POST /api/ltsd-addon/generate', () => {
  const certificatePayload = {
    evaluationId: '44444444-4444-4444-4444-444444444444',
    certificateCode: 'EUR-MED',
    supplier: {
      name: 'Polymer Supplier BV',
      street: 'Main Street 1',
      city: 'Rotterdam',
      postalCode: '3011AA',
      country: 'NL',
      vatNumber: 'NL123456789B01',
    },
    customer: {
      name: 'Maple Importers Inc.',
      street: '100 Bay Street',
      city: 'Toronto',
      postalCode: 'M5J2N8',
      country: 'CA',
    },
    validFrom: '2025-01-05',
    validTo: '2026-01-04',
    signatoryName: 'Jane Compliance',
    signatoryTitle: 'Head of Trade Compliance',
    issueLocation: 'Rotterdam',
    notes: 'Batch QA complete',
  };

  it('streams the PDF response with ledger headers', async () => {
    const pdfBody = '%PDF-1.4\n%âãÏÓ\n';
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(pdfBody, {
        status: 200,
        headers: {
          'content-type': 'application/pdf',
          'x-notary-hash': 'abc123',
          'x-ledger-reference': 'ledger://certificate/xyz789',
          'content-disposition': 'attachment; filename=test.pdf',
        },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const request = new NextRequest('http://localhost/api/ltsd-addon/generate', {
      method: 'POST',
      body: JSON.stringify(certificatePayload),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await generateHandler(request);
    const buffer = Buffer.from(await response.arrayBuffer());

    expect(response.status).toBe(200);
    expect(response.headers.get('x-notary-hash')).toBe('abc123');
    expect(response.headers.get('x-ledger-reference')).toBe('ledger://certificate/xyz789');
    expect(buffer.toString()).toBe(pdfBody);
  });

  it('bubbles up LTSD errors for invalid evaluation status', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: 'certificate_available_only_for_qualified_verdicts' }), {
        status: 422,
        headers: { 'content-type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const request = new NextRequest('http://localhost/api/ltsd-addon/generate', {
      method: 'POST',
      body: JSON.stringify(certificatePayload),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await generateHandler(request);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.error).toBe('certificate_available_only_for_qualified_verdicts');
  });
});

describe('GET /api/certificates/:id', () => {
  it('returns certificate metadata when present', async () => {
    vi.spyOn(repository, 'getCertificateById').mockResolvedValue({
      id: 'CERT-001',
      productSku: 'SKU-1',
      hs6: '390110',
      agreement: 'CETA',
      status: 'done',
      result: { evaluationId: '44444444-4444-4444-4444-444444444444' },
      createdAt: '2025-01-05T10:00:00Z',
      updatedAt: '2025-01-05T10:00:00Z',
    });

    const request = new NextRequest('http://localhost/api/certificates/CERT-001');
    const response = await certificateHandler(request, { params: { id: 'CERT-001' } });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.id).toBe('CERT-001');
    expect(body.status).toBe('done');
  });

  it('returns 404 when certificate is missing', async () => {
    vi.spyOn(repository, 'getCertificateById').mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/certificates/MISSING');
    const response = await certificateHandler(request, { params: { id: 'MISSING' } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('Certificate not found');
  });
});
