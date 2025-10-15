import { z } from 'zod';

export const AssessmentSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  name: z.string().min(3, 'Name must be at least 3 characters'),
  dueDate: z.string().optional(),
  assignedTo: z.string().optional(),
  status: z.enum(['pending', 'in-progress', 'completed']),
  createdAt: z.date().optional(),
});

export type Assessment = z.infer<typeof AssessmentSchema>;
