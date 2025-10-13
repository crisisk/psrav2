import { describe, expect, it } from 'vitest';
import { pdfGenerator } from '@/lib/pdf-generator';
import type { Certificate } from '@/lib/repository';

const baseCertificate: Certificate = {
  id: 'mock-id',
  productSku: 'SKU-1000',
  hs6: '390110',
  agreement: 'CETA',
  status: 'done',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  result: {
    isConform: true,
    confidence: 0.92,
    explanation: 'Mock explanation',
  } as unknown as Record<string, unknown>,
};

describe('PDFCertificateGenerator', () => {
  it('creates a non-empty PDF document for certificate data', () => {
    const buffer = pdfGenerator.generateCertificate({
      ...baseCertificate,
      result: {
        isConform: true,
        confidence: 0.92,
        explanation: 'Mock explanation',
        appliedRules: [
          {
            id: 'rule-1',
            ruleText: 'Manufacture in which the value of all non-originating materials does not exceed 40%.',
            priority: 1,
          },
        ],
        calculations: {
          rvc: 72.4,
          maxNom: 27.6,
          changeOfTariff: true,
        },
        alternatives: [
          { type: 'V', result: true, confidence: 0.9, details: 'MaxNOM satisfied' },
        ],
        materials: [
          { hsCode: '320411', origin: 'EU', value: 600, percentage: 60, description: 'Pigment Concentrate' },
        ],
        manufacturingProcesses: ['Extrusion'],
      },
    });

    expect(buffer.length).toBeGreaterThan(1000);
  });
});
