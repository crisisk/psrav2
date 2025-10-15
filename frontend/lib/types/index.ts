export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  timestamp: string;
  ipAddress: string;
  metadata: Record<string, unknown>;
}
