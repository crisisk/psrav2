import { z } from 'zod';

export const AssignTierSchema = z.object({
  partnerId: z.string().uuid({ message: 'Invalid UUID format' }),
  assessmentScore: z.number().min(0).max(100)
});
