import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth/session'

// Zod schema for request validation
const triggerSchema = z.object({
  workflowType: z.enum(['NEW_ASSESSMENT', 'SUPPLIER_ONBOARDING']),
  entityId: z.string().uuid()
})

export async function POST(req: NextRequest) {
  try {
    // Authentication check
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Request validation
    const body = await req.json()
    const validation = triggerSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      )
    }

    const { workflowType, entityId } = validation.data

    // Create workflow in database
    const newWorkflow = await prisma.onboardingWorkflow.create({
      data: {
        type: workflowType,
        status: 'PENDING',
        initiatedBy: user.id,
        entityId: entityId,
        steps: {
          create: workflowType === 'NEW_ASSESSMENT' 
            ? assessmentSteps
            : supplierSteps
        }
      },
      include: { steps: true }
    })

    return NextResponse.json(
      { workflow: newWorkflow },
      { status: 201 }
    )

  } catch (error) {
    console.error('[OnboardingTrigger] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Example step configurations
const assessmentSteps = [
  { stepName: 'DOCUMENT_COLLECTION', order: 1 },
  { stepName: 'RISK_ASSESSMENT', order: 2 },
  { stepName: 'APPROVAL', order: 3 }
]

const supplierSteps = [
  { stepName: 'SUPPLIER_REGISTRATION', order: 1 },
  { stepName: 'COMPLIANCE_CHECK', order: 2 },
  { stepName: 'CONTRACT_SIGNING', order: 3 }
]