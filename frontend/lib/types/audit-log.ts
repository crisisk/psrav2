export interface AuditLog {
  id: string
  timestamp: Date

  userId?: string
  email: string
  success: boolean
  ipAddress: string
  userAgent: string
  action: string
  entityType: string
  entityId: string
}
