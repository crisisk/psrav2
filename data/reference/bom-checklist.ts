import type { BomLineItem } from '@/lib/invoice-validator';

export interface BomReference {
  hsCode: string;
  description: string;
  regionalValueThreshold: number;
  deMinimisAllowance: number;
  tradeAgreementEligible: boolean;
  bindingRulingId?: string;
  sources: {
    wco: boolean;
    psr: boolean;
    llmConsensus: boolean;
  };
}

interface MatchedReference extends BomReference {
  matchedSku: string;
  matchScore: number;
  thresholdBreached: boolean;
  materialShare: number;
}

const BOM_REFERENCE_DATA: BomReference[] = [
  {
    hsCode: '850110',
    description: 'Elektromotoren < 37,5 W',
    regionalValueThreshold: 40,
    deMinimisAllowance: 5000,
    tradeAgreementEligible: true,
    bindingRulingId: 'NL-BTI-2024-1122',
    sources: {
      wco: true,
      psr: true,
      llmConsensus: true,
    },
  },
  {
    hsCode: '392690',
    description: 'Kunststof onderdelen voor machines',
    regionalValueThreshold: 50,
    deMinimisAllowance: 2500,
    tradeAgreementEligible: true,
    sources: {
      wco: true,
      psr: true,
      llmConsensus: true,
    },
  },
  {
    hsCode: '730890',
    description: 'Stalen constructiedelen',
    regionalValueThreshold: 55,
    deMinimisAllowance: 10000,
    tradeAgreementEligible: false,
    bindingRulingId: 'NL-BTI-2023-0788',
    sources: {
      wco: true,
      psr: true,
      llmConsensus: false,
    },
  },
  {
    hsCode: '852380',
    description: 'Opslagmedia voor elektronica',
    regionalValueThreshold: 45,
    deMinimisAllowance: 7500,
    tradeAgreementEligible: true,
    sources: {
      wco: true,
      psr: false,
      llmConsensus: true,
    },
  },
];

function calculateMatchScore(descriptionA: string, descriptionB: string) {
  const tokensA = descriptionA.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const tokensB = descriptionB.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  if (tokensA.length === 0 || tokensB.length === 0) {
    return 0;
  }

  const overlap = tokensA.filter(token => tokensB.includes(token)).length;
  return overlap / Math.max(tokensA.length, tokensB.length);
}

export function findBomReferences(items: BomLineItem[]): (MatchedReference & { deMinimisAllowance: number })[] {
  const totalValue = items.reduce((acc, item) => acc + Math.max(0, item.value), 0);

  return items.map(item => {
    const reference = BOM_REFERENCE_DATA.find(entry => entry.hsCode === item.hsCode);
    const materialShare = totalValue === 0 ? 0 : (Math.max(0, item.value) / totalValue) * 100;
    if (!reference) {
      return {
        hsCode: item.hsCode,
        description: 'Geen referentie gevonden',
        regionalValueThreshold: 0,
        deMinimisAllowance: 0,
        tradeAgreementEligible: false,
        sources: {
          wco: false,
          psr: false,
          llmConsensus: false,
        },
        matchedSku: item.sku,
        matchScore: 0,
        thresholdBreached: false,
        materialShare,
      };
    }

    const matchScore = calculateMatchScore(item.description, reference.description);
    const thresholdBreached = materialShare > reference.regionalValueThreshold;

    return {
      ...reference,
      matchedSku: item.sku,
      matchScore,
      thresholdBreached,
      materialShare,
    };
  });
}
