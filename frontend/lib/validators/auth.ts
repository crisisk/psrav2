import { z } from 'zod';

export const emailSchema = z.string().email('Valid email required');
export const passwordSchema = z.string().min(8, 'Minimum 8 characters required');

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
