import { describe, expect, it, vi, afterAll } from 'vitest';
import { originEngine } from '@/lib/advanced-origin-engine';

const baseRequest = {
  productSku: 'SKU-1000',
  hsCode: '390110',
  tradeAgreement: 'CETA',
  productValue: 1000,
  materials: [
    { hsCode: '320411', origin: 'EU', value: 600, percentage: 60 },
    { hsCode: '381210', origin: 'CA', value: 200, percentage: 20 },
    { hsCode: '390110', origin: 'CN', value: 200, percentage: 20 },
  ],
  manufacturingProcesses: ['Polymerisation'],
};

describe('AdvancedOriginEngine', () => {
  afterAll(() => {
    vi.useRealTimers();
  });

  it('confirms origin compliance when MaxNOM alternative passes', async () => {
    const result = await originEngine.calculateOrigin(baseRequest);

    expect(result.isConform).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.5);
    expect(result.appliedRules).toHaveLength(1);
    expect(result.alternatives?.some((alt) => alt.type === 'V' && alt.result)).toBe(true);
    expect(result.calculations.maxNom).toBeLessThanOrEqual(40);
  });

  it('identifies non-conforming scenario when non-originating content exceeds threshold', async () => {
    const nonConforming = await originEngine.calculateOrigin({
      ...baseRequest,
      materials: [
        { hsCode: '390110', origin: 'CN', value: 600, percentage: 60 },
        { hsCode: '390120', origin: 'MX', value: 250, percentage: 25 },
        { hsCode: '390140', origin: 'US', value: 150, percentage: 15 },
      ],
    });

    expect(nonConforming.isConform).toBe(false);
    expect(nonConforming.confidence).toBeLessThan(0.6);
    expect(
      nonConforming.alternatives?.some((alt) => alt.type === 'V' && alt.result === false)
    ).toBe(true);
  });

  it('falls back gracefully when no rules are available', async () => {
    const missingRule = await originEngine.calculateOrigin({
      ...baseRequest,
      hsCode: '999999',
      tradeAgreement: 'Unknown',
    });

    expect(missingRule.isConform).toBe(false);
    expect(missingRule.appliedRules).toHaveLength(0);
    expect(missingRule.explanation).toContain('No applicable origin rules');
  });
});
