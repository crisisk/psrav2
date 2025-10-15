import { z } from 'zod';

export const CustomerCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(6, 'Phone must be at least 6 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters')
});

export type CustomerCreate = z.infer<typeof CustomerCreateSchema>;
