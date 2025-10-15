// Commission dispute type definition
export interface CommissionDispute {
  id: string;
  disputeNumber: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';
  amount: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  commissionId: string;
}

export interface CreateCommissionDisputeDTO {
  title: string;
  description: string;
  amount: number;
  userId: string;
  commissionId: string;
}

export interface UpdateCommissionDisputeDTO {
  title?: string;
  description?: string;
  status?: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'CLOSED';
  amount?: number;
}
