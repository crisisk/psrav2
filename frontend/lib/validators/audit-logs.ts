// Validator functions for audit log operations

export const validateBulkActionRequest = (data: unknown): data is {
  action: 'export' | 'delete' | 'archive';
  logIds: string[]
} => {
  if (!data || typeof data !== 'object') return false;

  const req = data as any;

  if (!req.action || !['export', 'delete', 'archive'].includes(req.action)) {
    return false;
  }

  if (!Array.isArray(req.logIds) || req.logIds.length === 0) {
    return false;
  }

  return req.logIds.every((id: unknown) => typeof id === 'string');
};
