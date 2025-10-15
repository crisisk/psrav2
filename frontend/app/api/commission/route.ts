import { NextResponse } from 'next/server'
import { z } from 'zod'
import { handleError } from '@/lib/error-handler'
import { auth } from '@/lib/auth'

// Validation schema for commission rate payload
const CommissionRateSchema = z.object({
  rate: z.number().min(0).max(100).refine(val => !isNaN(val), {
    message: 'Commission rate must be a valid number'
  }),
  effectiveDate: z.string().datetime(),
  productId: z.string().uuid()
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const rawBody = await req.json()
    const validationResult = CommissionRateSchema.safeParse(rawBody)

    if (!validationResult.success) {
      return NextResponse.json(
        { errors: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    // In real implementation, this would call a service layer
    const { rate, effectiveDate, productId } = validationResult.data
    
    // Simulate database operation
    const newRate = {
      id: crypto.randomUUID(),
      rate,
      effectiveDate: new Date(effectiveDate),
      productId,
      setBy: session.user.id,
      createdAt: new Date()
    }

    return NextResponse.json(
      { data: newRate },
      { status: 201 }
    )
  } catch (error) {
    return handleError(error)
  }
}
