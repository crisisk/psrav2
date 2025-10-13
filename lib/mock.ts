// Mock API utility
export function shouldUseMock(): boolean {
  return process.env.NEXT_PUBLIC_API_MOCKING === 'enabled' ||
         process.env.NEXT_PUBLIC_DEMO_MODE === 'true' ||
         !process.env.API_BASE_URL;
}

export function mockXaiExplanation(assessmentId: string) {
  return {
    verdict: 'GO' as const,
    summary: `This product qualifies for preferential treatment under the selected trade agreement. Assessment ID: ${assessmentId}`,
    agreement: {
      name: 'EU-Japan EPA',
      ruleType: 'CTH' as const
    },
    rulePath: {
      checkpoints: [
        {
          id: 'check-1',
          name: 'HS Code Classification',
          status: 'PASS' as const,
          rationale: 'Product is correctly classified under HS code'
        },
        {
          id: 'check-2',
          name: 'Change in Tariff Heading',
          status: 'PASS' as const,
          rationale: 'Sufficient transformation occurred to meet CTH requirement'
        },
        {
          id: 'check-3',
          name: 'Regional Value Content',
          status: 'PASS' as const,
          rationale: 'Product meets the minimum regional content threshold'
        }
      ]
    },
    chainClosure: {
      coverage: 95,
      bomTree: {
        id: 'root',
        name: 'Final Product',
        children: [
          {
            id: 'comp-1',
            name: 'Component A',
            children: []
          },
          {
            id: 'comp-2',
            name: 'Component B',
            children: []
          }
        ]
      },
      missingNodes: ['Component C - Supplier documentation pending']
    },
    inputs: {
      hsCode: '8471.30',
      bomNodesCount: 15,
      documentsCount: 12
    },
    trace: {
      id: `trace-${assessmentId}`,
      durationMs: 2345,
      confidence: 0.92
    }
  };
}
