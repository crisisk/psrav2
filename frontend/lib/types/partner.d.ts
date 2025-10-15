export type PartnerTier = {
  id: string;
  name: string;
  tier: 'bronze' | 'silver' | 'gold';
  totalSales: number;
};
