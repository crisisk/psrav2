export interface AuditLog {
  id: string;
  timestamp: Date;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  userId: string;
  entityType: string;
  entityId: string;
  details: string;
}
