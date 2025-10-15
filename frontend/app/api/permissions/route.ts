import { NextResponse } from 'next/server'
import { checkPermission, UserTier } from '@/lib/permissions'

export async function GET() {
  try {
    // Stub session for build - replace with actual auth in production
    const session = { user: { tier: UserTier.TIER1 } }
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // In real implementation, fetch user's tier from database
    const userTier = session.user.tier as UserTier

    return NextResponse.json({
      allowedPermissions: Object.values(UserTier)
        .filter(tier => checkPermission(userTier, tier))
        .map(tier => tier.toLowerCase()),
      userTier
    })
  } catch (error) {
    console.error('[PERMISSIONS_ERROR]', error)
    return NextResponse.json(
      { error: 'Failed to fetch permissions' },
      { status: 500 }
    )
  }
}
