/**
 * External service integration for audit logging
 */

interface AuditEvent {
  eventType: string
  userId: string
  metadata?: Record<string, unknown>
  timestamp?: Date
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Mock API client for demonstration purposes
 * @param endpoint - API endpoint URL
 * @param options - Request options
 */
const mockApiClient = async <T>(endpoint: string, options: RequestInit): Promise<T> => {
  await new Promise(resolve => setTimeout(resolve, 500))
  return { status: 'success' } as T
}

/**
 * Validates audit event data
 * @param event - Audit event to validate
 * @returns Validation result with errors array
 */
export const validateEventData = (event: AuditEvent): ValidationResult => {
  const errors: string[] = []
  if (!event.eventType) errors.push('Event type is required')
  if (!event.userId) errors.push('User ID is required')
  return { isValid: errors.length === 0, errors }
}

const AuditService = {
  /**
   * Logs an audit event to external service
   * @param event - Audit event data
   * @throws Error when logging fails
   */
  async logEvent(event: AuditEvent): Promise<void> {
    const validation = validateEventData(event)
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`)
    }

    try {
      await mockApiClient<void>('/audit/log', {
        method: 'POST',
        body: JSON.stringify({ ...event, timestamp: new Date() })
      })
    } catch (error) {
      throw new Error(`Audit logging failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  /**
   * Retrieves audit events from external service
   * @param userId - Filter events by user ID
   * @param limit - Maximum number of events to return
   */
  async getEvents(userId?: string, limit = 100): Promise<AuditEvent[]> {
    try {
      return await mockApiClient<AuditEvent[]>(
        `/audit/logs?${new URLSearchParams({ userId: userId ?? '', limit: limit.toString() })}`,
        { method: 'GET' }
      )
    } catch (error) {
      throw new Error(`Failed to fetch audit logs: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

export default AuditService
export type { AuditEvent, ValidationResult }

/**
 * Audit service instance
 */
export const auditService = {
  log: (action: string, data: any) => {
    console.log('[Audit]', action, data);
  },

  logAction: async (data: any) => {
    console.log('[Audit] Action logged:', data);
    // In a real application, this would call AuditService.logEvent
    // For now, we'll just log to console.
  },

  logOriginCalculation: (data: any) => {
    console.log('[Audit] Origin calculation:', data);
  }
};
