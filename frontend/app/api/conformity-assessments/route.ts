import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const AssessmentSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  status: z.enum(['Pending', 'InProgress', 'Completed'])
})

export async function GET() {
  try {
    const assessments = await prisma.conformityAssessment.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(assessments)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validation = AssessmentSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { errors: validation.error.flatten() },
        { status: 400 }
      )
    }

    const existingAssessment = await prisma.conformityAssessment.findFirst({
      where: { name: body.name }
    })

    if (existingAssessment) {
      return NextResponse.json(
        { error: 'Assessment with this name already exists' },
        { status: 409 }
      )
    }

    const newAssessment = await prisma.conformityAssessment.create({
      data: validation.data
    })

    return NextResponse.json(newAssessment, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
