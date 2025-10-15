import { z } from 'zod';

export const updatePartnerSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Must be a valid URL'),
  description: z.string().optional(),
  email: z.string().email('Must be a valid email address').optional(),
});
