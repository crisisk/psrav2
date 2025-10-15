/**
 * Common TypeScript types for PSRA-LTSD
 */

export interface CommissionDispute {
  id: string;
  commissionId: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

export interface AuditLog {
  id: string;
  action: string;
  userId?: string;
  timestamp: Date;
  details?: any;
  [key: string]: any;
}

export interface Certificate {
  id: string;
  productName: string;
  hsCode: string;
  originCountry: string;
  createdAt: string;
  [key: string]: any;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  [key: string]: any;
}

export interface ComplianceStamp {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum DealStage {
  NEW = 'New',
  CONTACTED = 'Contacted',
  QUALIFIED = 'Qualified',
  PROPOSAL = 'Proposal',
  NEGOTIATION = 'Negotiation',
  WON = 'Won',
  LOST = 'Lost'
}

export default {
  CommissionDispute,
  AuditLog,
  Certificate,
  User,
  ComplianceStamp,
  Lead,
  DealStage
};
