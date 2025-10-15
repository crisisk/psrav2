import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/auth'
import { startNewAssessment } from '@/lib/assessments'

type AssessmentStartResponse = {
  id?: string
  error?: string
}

export async function POST(req: NextRequest) {
  try {
    // Validate HTTP method
    if (req.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      )
    }

    // Authentication check
    const session = await getSession()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Business logic
    const newAssessment = await startNewAssessment(session.user.id)

    return NextResponse.json(
      { id: newAssessment.id } as AssessmentStartResponse,
      { status: 201 }
    )
  } catch (error) {
    console.error('Assessment start failed:', error)
    return NextResponse.json(
      { error: 'Internal server error' } as AssessmentStartResponse,
      { status: 500 }
    )
  }
}
