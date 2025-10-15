import type { CommissionTier } from '@/types/commission';

const SALES_TIERS: CommissionTier[] = [
  { min: 0, max: 1000, rate: 0.1 },
  { min: 1000, max: 5000, rate: 0.15 },
  { min: 5000, max: Infinity, rate: 0.2 }
];

const REFERRAL_TIERS: CommissionTier[] = [
  { min: 0, max: 500, rate: 0.05 },
  { min: 500, max: 2000, rate: 0.1 },
  { min: 2000, max: Infinity, rate: 0.15 }
];

export function calculateCommission(amount: number, type: 'SALES' | 'REFERRAL'): number {
  const tiers = type === 'SALES' ? SALES_TIERS : REFERRAL_TIERS;
  
  for (const tier of tiers) {
    if (amount >= tier.min && amount < tier.max) {
      return amount * tier.rate;
    }
  }
  
  // Fallback to lowest tier if no match (should never happen with Infinity)
  return amount * tiers[0].rate;
}
