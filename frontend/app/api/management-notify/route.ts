import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sendManagementNotification } from '@/lib/services/managementNotificationService'

const RequestSchema = z.object({
  auditLogId: z.string().uuid(),
  userId: z.string().uuid(),
})

export async function POST(request: Request) {
  try {
    // Validate request body
    const rawBody = await request.json()
    const validationResult = RequestSchema.safeParse(rawBody)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validationResult.error.format() },
        { status: 400 }
      )
    }

    // Process notification
    const { auditLogId, userId } = validationResult.data
    const result = await sendManagementNotification(auditLogId, userId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 422 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Management team notified successfully'
    })

  } catch (error) {
    console.error('[MANAGEMENT_NOTIFY_ERROR]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
