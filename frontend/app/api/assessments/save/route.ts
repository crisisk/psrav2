import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schema for assessment data
const AssessmentSchema = z.object({
  currentStep: z.number().min(1).max(5),
  formData: z.record(z.unknown())
})

export async function POST(req: NextRequest) {
  try {
    // Authentication check (simulated)
    const sessionToken = req.cookies.get('sessionToken')?.value
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate request body
    const rawBody = await req.json()
    const validation = AssessmentSchema.safeParse(rawBody)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors },
        { status: 400 }
      )
    }

    // Simulate database save operation
    const { currentStep, formData } = validation.data
    console.log(`Saving step ${currentStep} data:`, formData)

    return NextResponse.json({
      success: true,
      message: `Progress saved at step ${currentStep}`,
      nextStep: currentStep < 5 ? currentStep + 1 : null
    })

  } catch (error) {
    console.error('Save error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
