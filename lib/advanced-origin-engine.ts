import { runMultiModelConsensus } from './ai/consensus-orchestrator';
import type { ConsensusOutcome, ProviderCallResult } from './ai/types';
import { query } from './db';
import { mockOriginRules } from './mock-data';

export interface Material {
  hsCode: string;
  origin: string;
  value: number;
  percentage: number;
  description?: string;
}

export interface OriginCalculationRequest {
  productSku: string;
  hsCode: string;
  tradeAgreement: string;
  materials: Material[];
  productValue: number;
  manufacturingProcesses?: string[];
}

export interface OriginRule {
  id: string;
  hsCode: string;
  tradeAgreement: string;
  ruleText: string;
  conditions: any;
  priority: number;
}

export interface OriginCalculationResult {
  isConform: boolean;
  confidence: number;
  explanation: string;
  appliedRules: OriginRule[];
  calculations: {
    rvc?: number;
    maxNom?: number;
    changeOfTariff?: boolean;
    whollyObtained?: boolean;
  };
  alternatives: {
    type: string;
    result: boolean;
    details: string;
  }[];
  consensusSummary?: string;
  consensusScore?: number;
  dissentingOpinions?: string[];
  humanReviewRequired?: boolean;
  aiDecisions?: ProviderCallResult[];
  aiConsensusEnabled?: boolean;
  auditTrail?: ConsensusOutcome['auditTrail'];
}

export class AdvancedOriginEngine {

  async calculateOrigin(request: OriginCalculationRequest): Promise<OriginCalculationResult> {
    // Get applicable rules
    const rules = await this.getApplicableRules(request.hsCode, request.tradeAgreement);
    
    if (rules.length === 0) {
      return {
        isConform: false,
        confidence: 0,
        explanation: 'No applicable origin rules found',
        appliedRules: [],
        calculations: {},
        alternatives: []
      };
    }
    
    // Sort rules by priority
    rules.sort((a, b) => (a.priority || 999) - (b.priority || 999));
    
    // Evaluate each rule
    const evaluations = await Promise.all(
      rules.map(rule => this.evaluateRule(rule, request))
    );

    const evaluationSummaries = evaluations.map((evaluation, index) => ({
      ruleId: rules[index]?.id ?? `rule-${index + 1}`,
      isConform: evaluation.isConform,
      confidence: evaluation.confidence,
      explanation: evaluation.explanation,
    }));

    // Find best result
    const conformResults = evaluations.filter(e => e.isConform);
    const bestResult = conformResults.length > 0
      ? conformResults.reduce((best, current) =>
          current.confidence > best.confidence ? current : best
        )
      : evaluations[0];

    const consensusOutcome = await runMultiModelConsensus({
      request,
      evaluations: evaluationSummaries,
      bestResult,
    });

    const enrichedExplanation = [
      bestResult.explanation,
      consensusOutcome.consensusSummary,
    ]
      .filter(Boolean)
      .join('\n\n');

    return {
      ...bestResult,
      confidence: Math.max(bestResult.confidence, consensusOutcome.consensusScore ?? 0),
      explanation: enrichedExplanation,
      consensusSummary: consensusOutcome.consensusSummary,
      consensusScore: consensusOutcome.consensusScore,
      dissentingOpinions: consensusOutcome.dissentingOpinions,
      humanReviewRequired: consensusOutcome.requiresHumanReview,
      aiDecisions: consensusOutcome.providerDecisions,
      aiConsensusEnabled: consensusOutcome.enabled,
      auditTrail: consensusOutcome.auditTrail,
    } satisfies OriginCalculationResult;
  }
  
  private async getApplicableRules(hsCode: string, tradeAgreement: string): Promise<OriginRule[]> {
    try {
      const result = await query(`
        SELECT * FROM origin_rules
        WHERE "hsCode" = $1 AND "tradeAgreement" = $2 AND active = true
        ORDER BY
          CASE WHEN conditions->>'priority' IS NOT NULL
          THEN (conditions->>'priority')::int
          ELSE 999 END ASC
      `, [hsCode, tradeAgreement]);

      return (result.rows || []).map((row: any) => ({
        ...row,
        priority: row.priority ?? row.conditions?.priority ?? null,
      }));
    } catch (error) {
      console.error('Falling back to mock origin rules:', error);
      return mockOriginRules.filter((rule) =>
        rule.hsCode === hsCode && rule.tradeAgreement === tradeAgreement
      );
    }
  }
  
  private async evaluateRule(rule: OriginRule, request: OriginCalculationRequest): Promise<OriginCalculationResult> {
    const conditions = rule.conditions;
    const alternatives = conditions.alternatives || [];
    
    const evaluatedAlternatives = [];
    let bestAlternative = null;
    let highestConfidence = 0;
    
    // Evaluate each alternative (H, V, A)
    for (const alternative of alternatives) {
      const evaluation = await this.evaluateAlternative(alternative, request);
      evaluatedAlternatives.push(evaluation);
      
      if (evaluation.result && evaluation.confidence > highestConfidence) {
        bestAlternative = evaluation;
        highestConfidence = evaluation.confidence;
      }
    }
    
    // If no alternative passes, try basic rules
    if (!bestAlternative) {
      const basicEvaluation = await this.evaluateBasicRule(rule, request);
      if (basicEvaluation.result) {
        bestAlternative = basicEvaluation;
      }
    }
    
    const isConform = bestAlternative?.result || false;
    const confidence = bestAlternative?.confidence || 0;
    
    return {
      isConform,
      confidence,
      explanation: bestAlternative?.details || 'Rule evaluation failed',
      appliedRules: [rule],
      calculations: this.calculateMetrics(request),
      alternatives: evaluatedAlternatives
    };
  }
  
  private async evaluateAlternative(alternative: any, request: OriginCalculationRequest) {
    const type = alternative.type;
    const payload = alternative.payload;
    
    switch (type) {
      case 'H': // Heading change rule
        return this.evaluateHeadingChange(payload, request);
      
      case 'V': // Value rule
        return this.evaluateValueRule(payload, request);
      
      case 'A': // Alternative processing rule
        return this.evaluateProcessingRule(payload, request);
      
      default:
        return {
          type,
          result: false,
          confidence: 0,
          details: `Unknown alternative type: ${type}`
        };
    }
  }
  
  private evaluateHeadingChange(payload: any, request: OriginCalculationRequest) {
    const change = payload.change;
    const productChapter = request.hsCode.substring(0, 2);
    const productHeading = request.hsCode.substring(0, 4);
    
    let conformingMaterials = 0;
    let totalMaterials = request.materials.length;
    
    for (const material of request.materials) {
      const materialChapter = material.hsCode.substring(0, 2);
      const materialHeading = material.hsCode.substring(0, 4);
      
      let satisfiesChange = false;
      
      switch (change) {
        case 'CTH': // Change of Tariff Heading
          satisfiesChange = materialHeading !== productHeading;
          break;
        case 'CC': // Change of Chapter
          satisfiesChange = materialChapter !== productChapter;
          break;
        case 'CTSH': // Change of Tariff Sub-Heading
          satisfiesChange = material.hsCode.substring(0, 6) !== request.hsCode.substring(0, 6);
          break;
      }
      
      if (satisfiesChange) {
        conformingMaterials++;
      }
    }
    
    const conformanceRate = totalMaterials > 0 ? conformingMaterials / totalMaterials : 0;
    const result = conformanceRate >= 0.8; // 80% of materials must satisfy change
    
    return {
      type: 'H',
      result,
      confidence: result ? 0.85 + (conformanceRate * 0.1) : 0.3,
      details: `${change} rule: ${conformingMaterials}/${totalMaterials} materials satisfy change requirement`
    };
  }
  
  private evaluateValueRule(payload: any, request: OriginCalculationRequest) {
    const method = payload.method || (payload.maxNonOrigin !== undefined ? 'MaxNOM' : payload.metric);
    const threshold =
      payload.threshold ??
      payload.maxNonOrigin ??
      payload.minimumRvc ??
      payload.minRvc ??
      0;
    
    let calculatedValue = 0;
    let result = false;
    let details = '';
    
    switch (method) {
      case 'MaxNOM': // Maximum Non-Originating Materials
        const nonOriginatingValue = request.materials
          .filter(m => m.origin !== 'EU' && m.origin !== 'CA') // Adjust based on agreement
          .reduce((sum, m) => sum + m.value, 0);

        calculatedValue = (nonOriginatingValue / request.productValue) * 100;
        result = calculatedValue <= threshold;
        details = `MaxNOM: ${calculatedValue.toFixed(1)}% ≤ ${threshold}%`;
        break;

      case 'RVC': // Regional Value Content
        const originatingValue = request.materials
          .filter(m => m.origin === 'EU' || m.origin === 'CA') // Adjust based on agreement
          .reduce((sum, m) => sum + m.value, 0);

        calculatedValue = (originatingValue / request.productValue) * 100;
        result = calculatedValue >= threshold;
        details = `RVC: ${calculatedValue.toFixed(1)}% ≥ ${threshold}%`;
        break;

      default:
        details = 'Value rule configuration not recognised';
        result = false;
        break;
    }
    
    return {
      type: 'V',
      result,
      confidence: result ? 0.9 : 0.2,
      details
    };
  }
  
  private evaluateProcessingRule(payload: any, request: OriginCalculationRequest) {
    const requiredProcesses = payload.processes || payload.requiredProcesses || [];
    const productProcesses = request.manufacturingProcesses || [];
    
    const hasRequiredProcesses = requiredProcesses.every((process: string) => 
      productProcesses.includes(process)
    );
    
    return {
      type: 'A',
      result: hasRequiredProcesses,
      confidence: hasRequiredProcesses ? 0.8 : 0.1,
      details: `Processing rule: Required processes ${hasRequiredProcesses ? 'satisfied' : 'not satisfied'}`
    };
  }
  
  private async evaluateBasicRule(rule: OriginRule, request: OriginCalculationRequest) {
    // Fallback to basic rule evaluation
    const ruleText = rule.ruleText.toLowerCase();
    
    if (ruleText.includes('wholly obtained')) {
      return {
        type: 'basic',
        result: request.materials.every(m => m.origin === 'EU' || m.origin === 'CA'),
        confidence: 0.95,
        details: 'Wholly obtained rule applied'
      };
    }
    
    if (ruleText.includes('change of chapter')) {
      const productChapter = request.hsCode.substring(0, 2);
      const satisfiesChange = request.materials.every(m => 
        m.hsCode.substring(0, 2) !== productChapter
      );
      
      return {
        type: 'basic',
        result: satisfiesChange,
        confidence: 0.75,
        details: 'Basic change of chapter rule applied'
      };
    }
    
    return {
      type: 'basic',
      result: false,
      confidence: 0,
      details: 'No applicable basic rule found'
    };
  }
  
  private calculateMetrics(request: OriginCalculationRequest) {
    const totalValue = request.productValue;
    const nonOriginatingValue = request.materials
      .filter(m => m.origin !== 'EU' && m.origin !== 'CA')
      .reduce((sum, m) => sum + m.value, 0);
    
    const originatingValue = totalValue - nonOriginatingValue;
    
    return {
      rvc: (originatingValue / totalValue) * 100,
      maxNom: (nonOriginatingValue / totalValue) * 100,
      changeOfTariff: this.checkChangeOfTariff(request),
      whollyObtained: request.materials.every(m => m.origin === 'EU' || m.origin === 'CA')
    };
  }
  
  private checkChangeOfTariff(request: OriginCalculationRequest): boolean {
    const productHeading = request.hsCode.substring(0, 4);
    return request.materials.every(m => 
      m.hsCode.substring(0, 4) !== productHeading
    );
  }
}

export const originEngine = new AdvancedOriginEngine();
