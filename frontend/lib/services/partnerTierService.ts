import type { PartnerTier } from '@/lib/types/partner';

// Mock data store (replace with actual database integration)
const partners: PartnerTier[] = [
  { id: '1', name: 'Partner A', tier: 'gold', totalSales: 75000 },
  { id: '2', name: 'Partner B', tier: 'silver', totalSales: 30000 },
];

const VALID_TIERS = ['bronze', 'silver', 'gold'] as const;

export async function assignTier(partnerId: string, newTier: string) {
  // Validate tier
  if (!VALID_TIERS.includes(newTier as typeof VALID_TIERS[number])) {
    throw new Error('Invalid tier level');
  }

  // Find partner
  const partner = partners.find(p => p.id === partnerId);
  if (!partner) {
    throw new Error('Partner not found');
  }

  // Business rules validation
  if (newTier === 'gold' && partner.totalSales < 50000) {
    throw new Error('Insufficient sales for Gold tier');
  }

  // Update tier
  partner.tier = newTier as typeof VALID_TIERS[number];
  return partner;
}
