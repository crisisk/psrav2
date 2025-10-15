export interface CommissionEntry {
  partnerId: string;
  partnerName: string;
  transactionDate: Date;
  amount: number;
  commissionRate: number;
  commissionAmount: number;
}

export interface CommissionReport {
  reportDate: Date;
  periodStart: Date;
  periodEnd: Date;
  totalCommission: number;
  entries: CommissionEntry[];
}
