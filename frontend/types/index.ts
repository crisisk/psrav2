export interface ComplianceStamp {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

// Re-export from api.ts
export type { ApiResponse, PaginatedResponse, ApiError } from './api';

// Re-export from lead.ts
export type { Lead, LeadConversionResult } from './lead';


export interface Option {
  id: string;
  key: string;
  value: string;
  type: 'system' | 'user';
  createdAt: Date;
  updatedAt: Date;
}
