// shared/types/index.ts

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Approval {
  id: string;
  ltsdId: string;
  productName: string;
  supplier: string;
  value: number;
  status: ApprovalStatus;
  requestedAt: string;
  requestedBy: string;
  notes?: string;
}

export interface Assessment {
  id: string;
  productName: string;
  hsCode: string;
  agreement: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETE' | 'ERROR';
  result?: 'QUALIFYING' | 'NON_QUALIFYING';
  confidence?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChainNode {
  id: string;
  name: string;
  type: 'RAW_MATERIAL' | 'COMPONENT' | 'ASSEMBLY' | 'FINISHED_PRODUCT';
  origin: string;
  hasCoo: boolean;
  children?: ChainNode[];
}

export interface LTSDData {
  id: string;
  productName: string;
  hsCode: string;
  agreement: string;
  chain: ChainNode[];
  status: 'INCOMPLETE' | 'COMPLETE' | 'FINALIZED';
  createdAt: string;
  finalizedAt?: string;
}
