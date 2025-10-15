import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for request body
const requestSchema = z.object({
  system_id: z.string().min(1, 'System ID is required'),
  sections: z.array(z.string()).min(1, 'At least one section is required'),
  user_id: z.string().min(1, 'User ID is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    const body = await request.json();
    const validationResult = requestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { system_id, sections, user_id } = validationResult.data;

    // Mock documentation generation - replace with actual implementation
    const generatedDocument = {
      systemId: system_id,
      sections: sections.map((section) => ({
        name: section,
        content: `Automatically generated content for ${section} section`,
      })),
      generatedBy: user_id,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Documentation generated successfully',
      generatedDocument,
    });

  } catch (error) {
    console.error('Documentation generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
