import { randomUUID } from 'crypto';
import hsCodes from '@/data/hs-codes.json';
import tradeAgreements from '@/data/trade-agreements.json';
import originRules from '@/data/origin-rules.json';
import { personaScenarios } from '@/data/persona-scenarios';

export interface MockHsCode {
  chapter: string;
  code: string;
  description: string;
}

export interface MockTradeAgreement {
  code: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface MockCertificateResult {
  isConform: boolean;
  confidence: number;
  explanation: string;
  appliedRules: Array<{ id: string; ruleText: string; priority?: number | null }>;
  calculations?: {
    rvc?: number;
    maxNom?: number;
    changeOfTariff?: boolean;
    whollyObtained?: boolean;
  };
  alternatives?: Array<{
    type: string;
    result: boolean;
    confidence?: number;
    details?: string;
  }>;
  persona?: {
    id: string;
    name: string;
    role: string;
    objective: string;
  };
  materials?: Array<{
    hsCode: string;
    origin: string;
    value: number;
    percentage: number;
    description?: string;
  }>;
  manufacturingProcesses?: string[];
}

export interface MockCertificate {
  id: string;
  productSku: string;
  hs6: string;
  agreement: string;
  status: 'pending' | 'processing' | 'done' | 'failed';
  result?: MockCertificateResult;
  createdAt: string;
}

export interface MockOriginRule {
  id: string;
  hsCode: string;
  tradeAgreement: string;
  ruleText: string;
  conditions: Record<string, any>;
  priority: number;
}

const now = new Date();

export const mockHsCodes: MockHsCode[] = (hsCodes as MockHsCode[]).sort((a, b) => a.code.localeCompare(b.code));

export const mockTradeAgreements: MockTradeAgreement[] = (tradeAgreements as MockTradeAgreement[]).map((agreement) => ({
  ...agreement,
  active: agreement.active ?? true,
}));

export const mockOriginRules: MockOriginRule[] = (originRules as Array<Omit<MockOriginRule, 'id'>>).map((rule) => ({
  id: `${rule.hsCode}-${rule.tradeAgreement}`,
  ...rule,
}));

const initialCertificates: MockCertificate[] = personaScenarios
  .filter((persona) => persona.id !== 'custom')
  .slice(0, 4)
  .map((persona, index) => {
    const correspondingRule = mockOriginRules.find(
      (rule) => rule.hsCode === persona.hsCode && rule.tradeAgreement === persona.agreement
    );

    return {
      id: randomUUID(),
      productSku: persona.productSku,
      hs6: persona.hsCode,
      agreement: persona.agreement,
      status: index === 2 ? 'processing' : 'done',
      result: {
        isConform: index !== 2,
        confidence: index === 2 ? 0.6 : 0.88 + index * 0.02,
        explanation:
          index === 2
            ? 'Awaiting supporting documentation identified during persona validation.'
            : persona.insights.summary,
        appliedRules: correspondingRule
          ? [
              {
                id: correspondingRule.id,
                ruleText: correspondingRule.ruleText,
                priority: correspondingRule.priority,
              },
            ]
          : [],
        calculations: (() => {
          const nonOriginCountries = new Set(['CN', 'US', 'MX']);
          const nonOriginShare = persona.materials.reduce(
            (sum, material) =>
              nonOriginCountries.has(material.origin) ? sum + material.percentage : sum,
            0
          );
          return {
            rvc: Math.max(0, 100 - nonOriginShare),
            maxNom: persona.materials.reduce(
              (max, material) => (nonOriginCountries.has(material.origin) ? Math.max(max, material.percentage) : max),
              0
            ),
            changeOfTariff: true,
          };
        })(),
        alternatives: correspondingRule?.conditions?.alternatives?.map((alternative: any) => ({
          type: alternative.type,
          result: index !== 2 || alternative.type !== 'A',
          confidence: index === 2 && alternative.type === 'A' ? 0.55 : 0.85,
          details:
            alternative.type === 'V'
              ? 'Value-based rule evaluated via persona regression.'
              : alternative.type === 'H'
              ? 'Tariff shift validated against component headings.'
              : 'Manufacturing process checklist reviewed during persona run.',
        })) ?? [],
        persona: {
          id: persona.id,
          name: persona.name,
          role: persona.role,
          objective: persona.objective,
        },
        materials: persona.materials,
        manufacturingProcesses: persona.manufacturingProcesses,
      },
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * (index + 1)).toISOString(),
    } satisfies MockCertificate;
  });

let certificateMemory = [...initialCertificates];

export function getMockCertificates() {
  return certificateMemory.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
}

export function findMockCertificate(id: string) {
  return certificateMemory.find((certificate) => certificate.id === id) ?? null;
}

export function addMockCertificate(entry: {
  productSku: string;
  hs6: string;
  agreement: string;
  status?: 'pending' | 'processing' | 'done' | 'failed';
  result?: MockCertificateResult;
}) {
  const certificate: MockCertificate = {
    id: randomUUID(),
    productSku: entry.productSku,
    hs6: entry.hs6,
    agreement: entry.agreement,
    status: entry.status ?? 'done',
    result: entry.result,
    createdAt: new Date().toISOString(),
  };

  certificateMemory = [certificate, ...certificateMemory];
  return certificate;
}

export function computeMockAnalytics(startDate: Date, endDate: Date) {
  const certificates = getMockCertificates().filter((cert) => {
    const created = new Date(cert.createdAt);
    return created >= startDate && created <= endDate;
  });

  const total = certificates.length;
  const completed = certificates.filter((c) => c.status === 'done').length;
  const pending = certificates.filter((c) => c.status === 'pending').length;
  const processing = certificates.filter((c) => c.status === 'processing').length;

  const conformityPool = certificates.filter((c) => c.status === 'done' && c.result);
  const conforming = conformityPool.filter((c) => c.result?.isConform).length;
  const avgConfidence =
    conformityPool.length > 0
      ?
          conformityPool.reduce((sum, cert) => sum + (cert.result?.confidence ?? 0), 0) /
          conformityPool.length
      : 0;

  const byAgreement = certificates.reduce<Record<string, { total: number; completed: number }>>((acc, cert) => {
    if (!acc[cert.agreement]) {
      acc[cert.agreement] = { total: 0, completed: 0 };
    }
    acc[cert.agreement].total += 1;
    if (cert.status === 'done') {
      acc[cert.agreement].completed += 1;
    }
    return acc;
  }, {});

  const agreementMetrics = Object.entries(byAgreement).map(([agreement, value]) => ({
    agreement,
    total_certificates: value.total,
    completed_certificates: value.completed,
  }));

  return {
    summary: {
      total_certificates: total,
      completed_certificates: completed,
      pending_certificates: pending,
      processing_certificates: processing,
    },
    certificates: {
      statusDistribution: [
        { status: 'done', count: completed },
        { status: 'pending', count: pending },
        { status: 'processing', count: processing },
      ],
      conformityRate: {
        total,
        conforming,
        avg_confidence: avgConfidence,
      },
    },
    tradeAgreements: agreementMetrics,
  };
}
