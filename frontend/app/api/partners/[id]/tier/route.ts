import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

const TierSchema = z.enum(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'])

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Authorization check - example role check
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Validate partner ID
    const partnerId = params.id
    if (!partnerId || typeof partnerId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid partner ID' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    const validation = TierSchema.safeParse(body.tier)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid tier value' },
        { status: 400 }
      )
    }

    // Update partner tier in database
    const updatedPartner = await db.partner.update({
      where: { id: partnerId },
      data: { tier: validation.data },
      select: { id: true, name: true, tier: true }
    })

    return NextResponse.json(updatedPartner, { status: 200 })

  } catch (error) {
    console.error('[PARTNER_TIER_UPDATE]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
