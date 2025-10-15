/**
 * Origin determination models for PSRA-LTSD
 */

export enum Verdict {
  PREFERENTIAL = 'PREFERENTIAL',
  NON_PREFERENTIAL = 'NON_PREFERENTIAL'
}

export enum WCOStatus {
  VERIFIED = 'VERIFIED',
  PENDING = 'PENDING',
  FAILED = 'FAILED'
}

export interface BOMAnalysisItem {
  item_id: string;
  hs_code: string;
  value_eur: number;
  origin_country: string;
  is_non_originating: boolean;
  compliance_status: string;
  rule_violation_reason: string | null;
}

export interface OriginDeterminationResponse {
  verdict: Verdict;
  confidence_score: number;
  ruling_citation: string;
  ruling_id: string;
  wco_verification_status: WCOStatus;
  trace_log_id: string;
  bom_analysis: BOMAnalysisItem[];
}
