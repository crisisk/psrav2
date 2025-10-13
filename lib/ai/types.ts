import type {
  OriginCalculationRequest,
  OriginCalculationResult,
} from '../advanced-origin-engine';

export type LLMProviderType =
  | 'openai'
  | 'anthropic'
  | 'azure_openai'
  | 'vertex'
  | 'http';

export interface LLMProviderConfig {
  id: string;
  name: string;
  type: LLMProviderType;
  baseUrl?: string;
  model?: string;
  apiKey?: string;
  defaultTemperature?: number;
}

export interface ProviderCallSuccess {
  status: 'ok';
  providerId: string;
  providerName: string;
  decision: 'conform' | 'non-conform' | 'inconclusive';
  confidence: number;
  rationale: string;
  rawResponse: any;
  latencyMs: number;
}

export interface ProviderCallSkipped {
  status: 'skipped';
  providerId: string;
  providerName: string;
  reason: string;
}

export interface ProviderCallError {
  status: 'error';
  providerId: string;
  providerName: string;
  errorMessage: string;
}

export type ProviderCallResult = ProviderCallSuccess | ProviderCallSkipped | ProviderCallError;

export interface RuleEvaluationSummary {
  ruleId: string;
  isConform: boolean;
  confidence: number;
  explanation: string;
}

export interface ConsensusInput {
  request: OriginCalculationRequest;
  evaluations: RuleEvaluationSummary[];
  bestResult: OriginCalculationResult;
}

export interface ConsensusAuditTrail {
  consensusScore: number;
  requiredThreshold: number;
  providerDecisions: ProviderCallResult[];
  generatedAt: string;
}

export interface ConsensusOutcome {
  enabled: boolean;
  consensusScore: number;
  consensusSummary?: string;
  dissentingOpinions: string[];
  providerDecisions: ProviderCallResult[];
  requiresHumanReview: boolean;
  auditTrail: ConsensusAuditTrail;
}
