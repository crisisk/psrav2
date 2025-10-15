import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const UpdateSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  userId: z.string().min(1, 'User ID is required')
})

export async function PUT(
  req: NextRequest,
  { params }: { params: { systemId: string; sectionId: string } }
) {
  try {
    // Validate system and section IDs
    if (!params.systemId || !params.sectionId) {
      return NextResponse.json(
        { error: 'System ID and Section ID are required' },
        { status: 400 }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    const validation = UpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors.map(e => e.message) },
        { status: 400 }
      )
    }

    // Simulate database update (replace with actual DB call)
    const updatedSection = {
      systemId: params.systemId,
      sectionId: params.sectionId,
      content: validation.data.content,
      updatedAt: new Date().toISOString()
    }

    // TODO: Log audit entry when audit logging service is implemented
    // await auditLogService.log({
    //   userId: validation.data.userId,
    //   action: 'UPDATE_DOCUMENTATION',
    //   targetType: 'DOCUMENTATION_SECTION',
    //   targetId: params.sectionId,
    //   metadata: {
    //     systemId: params.systemId,
    //     previousContent: '...'
    //   }
    // })

    return NextResponse.json(updatedSection, { status: 200 })
  } catch (error) {
    console.error('Documentation update failed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
