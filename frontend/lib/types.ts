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

export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  createdAt: string;
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

export interface Partner {
  id: string;
  name: string;
  tier: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  [key: string]: any;
}

export interface Milestone {
  id: string;
  name: string;
  status: string;
}

export interface Commission {
  id: string;
  amount: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  milestones: Milestone[];
  assignedTo: User;
  documents: any[];
  [key: string]: any;
}

export interface RateData {
  id: string;
  rateName: string;
  rateValue: number;
  rateType: 'percentage' | 'fixed';
  createdAt: Date;
  updatedAt: Date;
}

export interface ResourceRequest {
  id: string;
  resourceType: string;
  title: string;
  description: string;
  userId: string;
  details: any;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface Tier {
  id: string;
  name: string;
  description: string;
  features: string[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  type: 'alert' | 'warning' | 'info';
}

export interface Assessment {
  id: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  date: string;
  visible: boolean;
}

export default {
  CommissionDispute,
  AuditLog,
  Certificate,
  Product,
  Partner,
  User,
  Commission,
  ResourceRequest,
  RateData,
  Notification,
  Tier,
  Assessment
};
