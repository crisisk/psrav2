import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

// Validation schema for request body
const NotificationSchema = z.object({
  sectionId: z.string().min(1, 'Section ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  completionTime: z.string().datetime('Invalid completion timestamp')
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = NotificationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.format() },
        { status: 400 }
      );
    }

    // Simulate compliance team notification (replace with actual integration)
    console.log('Notifying compliance team about completed section:', {
      section: validationResult.data.sectionId,
      user: validationResult.data.userId,
      completedAt: validationResult.data.completionTime
    });

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json(
      { 
        success: true,
        message: 'Compliance team notified successfully',
        data: validationResult.data
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Notification error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
