/**
 * UAT Persona Scenarios for PSRA-LTSD Platform
 * Defines test personas and their expected behaviors for user journey testing
 */

export interface PersonaScenario {
  id: string;
  name: string;
  role: 'finance' | 'compliance' | 'analyst' | 'auditor' | 'supplier' | 'sysadmin';
  description: string;
  primaryGoals: string[];
  typicalWorkflows: string[];
  expectedSatisfaction: number; // 1-5 scale
  completedTasks: number;
  totalTasks: number;
  // Optional fields for origin calculation scenarios
  productSku?: string;
  hsCode?: string;
  agreement?: string;
  successCriteria?: string[];
  productValue: number;
  materials: PersonaMaterial[];
  manufacturingProcesses: string[];
  objective: string;
  riskFocus?: string[];
  insights?: {
    summary?: string;
    validationNotes?: string[];
    followUpActions?: string[];
  };
}

export const PERSONA_SCENARIOS: PersonaScenario[] = [
  {
    id: 'finance-001',
    name: 'Sarah Chen - CFO',
    role: 'finance',
    description: 'Chief Financial Officer focused on ROI tracking and cost savings',
    primaryGoals: [
      'Track ROI per certificate',
      'Monitor eligibility savings',
      'Generate financial reports',
      'Approve budget allocations'
    ],
    typicalWorkflows: [
      'Dashboard → Financial Reports → Export',
      'Certificates → Filter by ROI → Analyze',
      'Analytics → Cost Savings → Trend Analysis'
    ],
    expectedSatisfaction: 4.5,
    completedTasks: 12,
    totalTasks: 15
  },
  {
    id: 'compliance-002',
    name: 'Marco van der Berg - Compliance Manager',
    role: 'compliance',
    description: 'Ensures HS39/40 compliance with inline document verification',
    primaryGoals: [
      'Validate HS39/40 dossiers',
      'Verify supporting documents',
      'Generate audit reports',
      'Track compliance status'
    ],
    typicalWorkflows: [
      'Compliance Dashboard → HS Codes → Validate',
      'Documents → Upload Evidence → Verify',
      'Certificates → Compliance Check → Approve'
    ],
    expectedSatisfaction: 4.3,
    completedTasks: 18,
    totalTasks: 20
  },
  {
    id: 'analyst-003',
    name: 'Priya Sharma - Data Analyst',
    role: 'analyst',
    description: 'Performs calculations with explainability and BOM validation',
    primaryGoals: [
      'Run origin calculations',
      'Validate BOM structures',
      'Analyze explainability data',
      'Generate technical reports'
    ],
    typicalWorkflows: [
      'Products → BOM Upload → Validate',
      'Calculator → Run Analysis → Export Results',
      'Explainability → Sankey Diagram → Drill Down'
    ],
    expectedSatisfaction: 4.6,
    completedTasks: 22,
    totalTasks: 24
  },
  {
    id: 'auditor-004',
    name: 'James Thompson - External Auditor',
    role: 'auditor',
    description: 'Reviews SLAs, sampling strategies, and audit trails',
    primaryGoals: [
      'Review audit trails',
      'Verify SLA compliance',
      'Sample certificates',
      'Generate audit reports'
    ],
    typicalWorkflows: [
      'Audit → View Trails → Export',
      'SLA Dashboard → Check Metrics → Report',
      'Certificates → Random Sample → Review'
    ],
    expectedSatisfaction: 4.2,
    completedTasks: 9,
    totalTasks: 12
  },
  {
    id: 'supplier-005',
    name: 'Anna Kowalski - Supplier Portal User',
    role: 'supplier',
    description: 'Uploads invoices, BOM lists, and monitors SLA/eligibility',
    primaryGoals: [
      'Upload invoices',
      'Submit BOM lists',
      'Monitor SLA status',
      'Track eligibility'
    ],
    typicalWorkflows: [
      'Supplier Portal → Upload Invoice → Submit',
      'BOM Upload → Validate → Confirm',
      'Status Dashboard → Track Progress'
    ],
    expectedSatisfaction: 4.4,
    completedTasks: 14,
    totalTasks: 16
  },
  {
    id: 'sysadmin-006',
    name: 'David Kim - System Administrator',
    role: 'sysadmin',
    description: 'Monitors platform health and manages notifications',
    primaryGoals: [
      'Monitor system health',
      'Configure notifications',
      'Manage user accounts',
      'Review error logs'
    ],
    typicalWorkflows: [
      'Admin Dashboard → System Status → Review',
      'Users → Manage Roles → Update',
      'Notifications → Configure Alerts → Save'
    ],
    expectedSatisfaction: 4.1,
    completedTasks: 8,
    totalTasks: 10
  },
  {
    id: 'finance-007',
    name: 'Lisa Martinez - Financial Analyst',
    role: 'finance',
    description: 'Analyzes cost trends and generates budget forecasts',
    primaryGoals: [
      'Analyze cost trends',
      'Generate forecasts',
      'Track budget allocations',
      'Monitor spending'
    ],
    typicalWorkflows: [
      'Analytics → Cost Trends → Export',
      'Budget → Forecast → Review',
      'Dashboard → Financial KPIs → Track'
    ],
    expectedSatisfaction: 4.7,
    completedTasks: 16,
    totalTasks: 18
  },
  {
    id: 'compliance-008',
    name: 'Thomas Weber - Regulatory Specialist',
    role: 'compliance',
    description: 'Ensures AI Act and CBAM compliance',
    primaryGoals: [
      'Verify AI Act compliance',
      'Monitor CBAM requirements',
      'Generate regulatory reports',
      'Track compliance metrics'
    ],
    typicalWorkflows: [
      'Compliance → AI Act → Verify',
      'CBAM Dashboard → Check Status → Report',
      'Certificates → Regulatory Check → Approve'
    ],
    expectedSatisfaction: 4.4,
    completedTasks: 11,
    totalTasks: 13
  },
  {
    id: 'analyst-009',
    name: 'Elena Popov - Operations Analyst',
    role: 'analyst',
    description: 'Optimizes workflows and identifies bottlenecks',
    primaryGoals: [
      'Analyze workflow efficiency',
      'Identify bottlenecks',
      'Generate optimization reports',
      'Track KPIs'
    ],
    typicalWorkflows: [
      'Operations → Workflow Analysis → Review',
      'Dashboard → KPI Tracking → Export',
      'Reports → Bottleneck Analysis → Action'
    ],
    expectedSatisfaction: 4.5,
    completedTasks: 19,
    totalTasks: 21
  },
  {
    id: 'auditor-010',
    name: 'Robert Brown - Internal Auditor',
    role: 'auditor',
    description: 'Conducts internal audits and compliance reviews',
    primaryGoals: [
      'Conduct internal audits',
      'Review compliance status',
      'Sample transactions',
      'Generate audit findings'
    ],
    typicalWorkflows: [
      'Audit → Internal Review → Sample',
      'Compliance → Status Check → Report',
      'Findings → Document → Export'
    ],
    expectedSatisfaction: 4.3,
    completedTasks: 13,
    totalTasks: 15
  }
];

/**
 * Get persona by ID
 */
export function getPersonaById(id: string): PersonaScenario | undefined {
  return PERSONA_SCENARIOS.find(p => p.id === id);
}

/**
 * Get personas by role
 */
export function getPersonasByRole(role: PersonaScenario['role']): PersonaScenario[] {
  return PERSONA_SCENARIOS.filter(p => p.role === role);
}

/**
 * Calculate overall satisfaction score
 */
export function getAverageSatisfaction(): number {
  const sum = PERSONA_SCENARIOS.reduce((acc, p) => acc + p.expectedSatisfaction, 0);
  return sum / PERSONA_SCENARIOS.length;
}

/**
 * Calculate overall completion rate
 */
export function getOverallCompletionRate(): number {
  const totalCompleted = PERSONA_SCENARIOS.reduce((acc, p) => acc + p.completedTasks, 0);
  const totalTasks = PERSONA_SCENARIOS.reduce((acc, p) => acc + p.totalTasks, 0);
  return totalCompleted / totalTasks;
}

/**
 * Get persona statistics
 */
export function getPersonaStats() {
  return {
    totalPersonas: PERSONA_SCENARIOS.length,
    avgSatisfaction: getAverageSatisfaction(),
    overallCompletion: getOverallCompletionRate(),
    byRole: {
      finance: getPersonasByRole('finance').length,
      compliance: getPersonasByRole('compliance').length,
      analyst: getPersonasByRole('analyst').length,
      auditor: getPersonasByRole('auditor').length,
      supplier: getPersonasByRole('supplier').length,
      sysadmin: getPersonasByRole('sysadmin').length
    }
  };
}

// Export alias for compatibility
export { PERSONA_SCENARIOS as personaScenarios };


/**
 * Represents a material used in an origin calculation scenario.
 */
export interface PersonaMaterial {
  name: string;
  origin: 'EU' | 'Non-EU';
  value: number;
  hsCode: string;
  percentage: number;
  description: string;
}

