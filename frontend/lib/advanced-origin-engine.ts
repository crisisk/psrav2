/**
 * Interface representing product origin calculation result
 */
interface ProductOriginResult {
  originEligible: boolean;
  rulesApplied: string[];
  summary: string;
  errors: string[];
}

/**
 * Interface representing an origin rule from PTA
 */
interface OriginRule {
  id: string;
  description: string;
  conditionType: 'regional-content' | 'material-list' | 'processing-step';
  threshold?: number;
  materialsRequired?: string[];
}

/**
 * Validation result structure
 */
interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Parameters for origin calculation
 */
interface CalculationParams {
  productId?: string;
  regionalContentPercentage: number;
  materialsUsed: string[];
  processingSteps: string[];
  tradeAgreement: string;
}

/**
 * Default export: AdvancedOriginEngine class
 */
export default class AdvancedOriginEngine {
  private apiEndpoint: string;

  constructor(apiEndpoint: string = process.env.ORIGIN_API_ENDPOINT!) {
    this.apiEndpoint = apiEndpoint;
  }

  /**
   * Calculate product origin eligibility
   * @param params Calculation parameters
   * @returns Promise with ProductOriginResult
   */
  async calculateOrigin(params: CalculationParams): Promise<ProductOriginResult> {
    const validation = validateCalculationParams(params);
    if (!validation.valid) {
      return this.createErrorResult(validation.errors);
    }

    try {
      const rules = await fetchOriginRules(this.apiEndpoint, params.tradeAgreement);
      return this.applyRules(params, rules);
    } catch (error) {
      return this.createErrorResult([error instanceof Error ? error.message : 'Unknown error']);
    }
  }

  private applyRules(params: CalculationParams, rules: OriginRule[]): ProductOriginResult {
    const result: ProductOriginResult = {
      originEligible: false,
      rulesApplied: [],
      summary: '',
      errors: [],
    };

    // Simplified rule processing logic
    for (const rule of rules) {
      try {
        let satisfied = false;
        switch (rule.conditionType) {
          case 'regional-content':
            satisfied = calculateRegionalContentPercentage(params.materialsUsed) >= (rule.threshold ?? 0);
            break;
          case 'material-list':
            satisfied = isMaterialListSatisfied(params.materialsUsed, rule.materialsRequired ?? []);
            break;
        }

        if (satisfied) {
          result.rulesApplied.push(rule.id);
        }
      } catch (error) {
        result.errors.push(`Rule ${rule.id} processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    result.originEligible = result.rulesApplied.length > 0;
    result.summary = result.originEligible 
      ? `Product meets ${result.rulesApplied.length} origin rules`
      : 'Product does not meet any origin rules';
    return result;
  }

  private createErrorResult(errors: string[]): ProductOriginResult {
    return {
      originEligible: false,
      rulesApplied: [],
      summary: 'Calculation failed',
      errors,
    };
  }
}

/**
 * Validates calculation parameters
 * @param params Calculation parameters
 * @returns ValidationResult
 */
export function validateCalculationParams(params: CalculationParams): ValidationResult {
  const errors: string[] = [];

  if (!params.productId.match(/^[A-Z0-9]{8}$/)) {
    errors.push('Invalid product ID format');
  }

  if (params.regionalContentPercentage < 0 || params.regionalContentPercentage > 100) {
    errors.push('Invalid regional content percentage');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Fetches origin rules from API
 * @param endpoint API endpoint
 * @param agreement Trade agreement code
 * @returns Promise with OriginRule array
 */
export async function fetchOriginRules(endpoint: string, agreement: string): Promise<OriginRule[]> {
  try {
    const response = await fetch(`${endpoint}/rules/${agreement}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    throw new Error(`Failed to fetch origin rules: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Calculates regional content percentage
 * @param materials List of material IDs
 * @returns Calculated percentage
 */
export function calculateRegionalContentPercentage(materials: string[]): number {
  const regionalMaterials = materials.filter(id => id.startsWith('REG-'));
  return (regionalMaterials.length / materials.length) * 100;
}

/**
 * Checks if required materials are present
 * @param materialsUsed List of used materials
 * @param requiredMaterials List of required materials
 * @returns Boolean indicating satisfaction
 */
export function isMaterialListSatisfied(materialsUsed: string[], requiredMaterials: string[]): boolean {
  return requiredMaterials.every(m => materialsUsed.includes(m));
}

/**
 * Origin calculation engine instance
 */
export const originEngine = {
  calculateOrigin: async (productData: any) => {
    console.log('[Origin Engine] Calculate origin for:', productData);
    return {
      isConform: true,
      confidence: 0.95,
      explanation: 'Stub result: Product is conform.',
      appliedRules: [],
      calculations: { rvc: 80, maxNom: 20, changeOfTariff: true },
      alternatives: [],
      dissentingOpinions: [],
      humanReviewRequired: false,
      aiConsensusEnabled: false,
      auditTrail: {
        consensusScore: 0.95,
        requiredThreshold: 0.75,
        providerDecisions: [],
        generatedAt: new Date().toISOString(),
      },
    } as OriginCalculationResult;
  },

  validateBOM: async (bom: any) => {
    console.log('[Origin Engine] Validate BOM');
    return { isValid: true, errors: [] };
  }
};

// Export stub types for API routes
export interface Material {
  id?: string;
  name?: string;
  originPercentage?: number;
  hsCode: string;
  origin: string;
  value?: number;
  percentage?: number;
  description?: string;
}

export interface OriginCalculationRequest {
  materials: Material[];
  productId?: string;
  productSku?: string;
  hsCode?: string;
  tradeAgreement?: string;
  productValue?: number;
  manufacturingProcesses?: string[];
}

export interface OriginCalculationResult {
  eligible?: boolean;
  percentage?: number;
  details?: string;
  isConform: boolean;
  confidence: number;
  explanation: string;
  appliedRules: Array<{
    id: string;
    hsCode?: string;
    tradeAgreement?: string;
    ruleText?: string;
    conditions?: string[];
    priority?: number;
  }>;
  calculations: {
    rvc: number;
    maxNom: number;
    changeOfTariff: boolean;
  };
  alternatives: Array<{
    type: string;
    result: boolean;
    details: string;
  }>;
  consensusSummary?: string;
  consensusScore?: number;
  dissentingOpinions: string[];
  humanReviewRequired: boolean;
  aiDecisions?: Array<any>;
  aiConsensusEnabled: boolean;
  auditTrail: {
    consensusScore: number;
    requiredThreshold: number;
    providerDecisions: Array<any>;
    generatedAt: string;
  };
}
