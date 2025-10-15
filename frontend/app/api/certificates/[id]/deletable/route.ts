import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { Certificate } from '@/lib/types'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const certificateId = params.id

    // Validate certificate ID format
    if (!/^[0-9a-fA-F]{24}$/.test(certificateId)) {
      return NextResponse.json(
        { error: 'Invalid certificate ID format' },
        { status: 400 }
      )
    }

    // Check certificate existence and approval status
    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      include: { shipments: true }
    })

    if (!certificate) {
      return NextResponse.json(
        { error: 'Certificate not found' },
        { status: 404 }
      )
    }

    // Determine deletability conditions
    const isApproved = certificate.status === 'APPROVED'
    const hasShipments = certificate.shipments.length > 0

    return NextResponse.json({
      deletable: !isApproved && !hasShipments,
      reasons: {
        isApproved,
        hasShipments
      }
    })

  } catch (error) {
    console.error('[CERTIFICATE_DELETABLE_CHECK]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
