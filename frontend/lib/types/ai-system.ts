export interface AiSystem {
  id: string;
  name: string;
  provider: string;
  description?: string;
  complianceStatus: 'compliant' | 'non-compliant' | 'in-review';
  lastAssessment?: Date;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface CreateAiSystemDto extends Omit<AiSystem, 'id' | 'complianceStatus' | 'riskLevel'> {
  complianceStatus?: AiSystem['complianceStatus'];
  riskLevel?: AiSystem['riskLevel'];
}