/**
 * Lead type definitions for PSRA-LTSD
 */

export interface Lead {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';
  source?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  convertedAt?: Date;
  customerId?: string;
  [key: string]: any;
}

export interface LeadConversionResult {
  success: boolean;
  customerId?: string;
  message: string;
}
