import { z } from 'zod';

export const partnerTierSchema = z.object({
  tier: z.enum(['bronze', 'silver', 'gold'])
});
