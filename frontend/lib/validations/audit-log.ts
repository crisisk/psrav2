import { z } from 'zod';

export const AuditLogSchema = z.object({
  userId: z.string().uuid({ message: 'Invalid user ID format' }),
  action: z.enum(['CREATE', 'READ', 'UPDATE', 'DELETE']),
  entityType: z.string().min(2, { message: 'Entity type must be at least 2 characters' }),
  entityId: z.string().uuid({ message: 'Invalid entity ID format' }),
  timestamp: z.string().datetime({ message: 'Invalid ISO datetime format' }),
  details: z.string().max(500, { message: 'Details cannot exceed 500 characters' }).optional(),
});
