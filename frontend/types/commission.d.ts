export interface CommissionTier {
  min: number;
  max: number;
  rate: number;
}

export interface CommissionCalculation {
  userId: string;
  saleAmount: number;
  commission: number;
  calculatedAt: Date;
  commissionType: 'SALES' | 'REFERRAL';
}
