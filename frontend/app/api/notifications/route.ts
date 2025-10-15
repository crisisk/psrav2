import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendMarketingNotification } from '@/lib/notifications'

const NotificationSchema = z.object({
  message: z.string().min(1),
  category: z.string().min(1),
  urgency: z.enum(['low', 'medium', 'high']).default('medium')
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    // Validate request body
    const validation = NotificationSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      )
    }

    // Send notification
    const result = await sendMarketingNotification(validation.data)

    if (!result.success) {
      throw new Error('Failed to send notification')
    }

    return NextResponse.json(
      { message: 'Notification sent to marketing team' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[NOTIFICATIONS_ERROR]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
