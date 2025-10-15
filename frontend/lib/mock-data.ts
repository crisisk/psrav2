/**
 * Mock data for PSRA-LTSD development and demos
 */

export const mockCertificates = [
  {
    id: '1',
    productName: 'Solar Panel Module XZ-100',
    origin: 'Netherlands',
    status: 'approved',
    createdAt: '2025-10-01T10:00:00Z'
  },
  {
    id: '2',
    productName: 'Wind Turbine Blade WT-500',
    origin: 'Germany',
    status: 'pending',
    createdAt: '2025-10-05T14:30:00Z'
  }
];

export const mockSuppliers = [
  {
    id: '1',
    name: 'GreenTech Solutions BV',
    country: 'Netherlands',
    complianceScore: 95
  },
  {
    id: '2',
    name: 'EcoMaterials GmbH',
    country: 'Germany',
    complianceScore: 88
  }
];

export const mockAnalytics = {
  totalCertificates: 127,
  activeCertificates: 98,
  pendingApprovals: 12,
  complianceScore: 92.5,
  trends: {
    certificates: [
      { date: '2025-09-01', value: 85 },
      { date: '2025-09-15', value: 102 },
      { date: '2025-10-01', value: 127 }
    ]
  }
};

export const mockTradeAgreements = [
  {
    id: '1',
    name: 'EU-Korea FTA',
    code: 'EU-KR',
    status: 'active',
    effectiveDate: '2011-07-01',
    countries: ['Korea, Republic of'],
    description: 'Free Trade Agreement between European Union and Korea'
  },
  {
    id: '2',
    name: 'CETA',
    code: 'CETA',
    status: 'active',
    effectiveDate: '2017-09-21',
    countries: ['Canada'],
    description: 'Comprehensive Economic and Trade Agreement'
  },
  {
    id: '3',
    name: 'EU-Japan EPA',
    code: 'EU-JP',
    status: 'active',
    effectiveDate: '2019-02-01',
    countries: ['Japan'],
    description: 'Economic Partnership Agreement between EU and Japan'
  }
];

export default {
  certificates: mockCertificates,
  suppliers: mockSuppliers,
  analytics: mockAnalytics,
  tradeAgreements: mockTradeAgreements
};


/**
 * Mock origin calculation rules
 */
export const mockOriginRules = [
  {
    id: '1',
    name: 'EU Origin Rule',
    hsCode: '8541',
    originCountry: 'EU',
    tradeAgreement: 'EU-KR',
    threshold: 0.45,
    description: 'Electronic component origin rule',
    ruleText: 'Regional value content of at least 45%',
    conditions: ['RVC >= 45%'],
    priority: 1
  },
  {
    id: '2',
    name: 'CETA Origin Rule',
    hsCode: '8542',
    originCountry: 'CA',
    tradeAgreement: 'CETA',
    threshold: 0.50,
    description: 'Canadian trade agreement rule',
    ruleText: 'Regional value content of at least 50%',
    conditions: ['RVC >= 50%'],
    priority: 1
  }
];

/**
 * Mock HS codes
 */
export const mockHsCodes = [
  { code: '8541', description: 'Diodes, transistors and similar semiconductor devices', chapter: '85' },
  { code: '8542', description: 'Electronic integrated circuits', chapter: '85' },
  { code: '8471', description: 'Automatic data processing machines', chapter: '84' }
];

/**
 * Compute mock analytics
 */
export function computeMockAnalytics(startDate?: any, endDate?: any): any {
  return {
    totalRevenue: 1250000,
    totalCertificates: 127,
    avgProcessingTime: 4.2,
    complianceRate: 94.5,
    startDate: startDate?.toISOString?.() || new Date().toISOString(),
    endDate: endDate?.toISOString?.() || new Date().toISOString(),
    trends: {
      monthly: [85, 92, 102, 115, 127]
    }
  };
}
