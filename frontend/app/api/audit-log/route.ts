import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createAuditLog, getAuditLogs } from '@/lib/services/audit-log-service'

// Zod schema for request validation
const AuditLogSchema = z.object({
  userId: z.string().optional(),
  email: z.string().email(),
  success: z.boolean(),
  ipAddress: z.string().ip(),
  userAgent: z.string(),
  action: z.string(),
  entityType: z.string(),
  entityId: z.string()
})

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json()
    
    // Validate request body
    const validationResult = AuditLogSchema.safeParse(requestBody)
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    // Create audit log entry
    const auditLog = await createAuditLog(validationResult.data)

    return NextResponse.json(auditLog, { status: 201 })
  } catch (error) {
    console.error('[AUDIT_LOG_ERROR]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const auditLogs = await getAuditLogs()
    return NextResponse.json(auditLogs)
  } catch (error) {
    console.error('[AUDIT_LOG_GET_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to retrieve audit logs' },
      { status: 500 }
    )
  }
}
