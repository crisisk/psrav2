import { NextResponse } from 'next/server';
import { z } from 'zod';
import { DocumentationSection } from '@/types/compliance';

const requestSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  version: z.number().positive('Invalid version number'),
});

export async function PUT(
  request: Request,
  { params }: { params: { sectionId: string } }
) {
  try {
    const sectionId = params.sectionId;
    if (!sectionId) {
      return NextResponse.json(
        { error: 'Section ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    // Simulated database update
    const updatedSection: DocumentationSection = {
      id: sectionId,
      content: validation.data.content,
      version: validation.data.version,
      lastModified: new Date().toISOString(),
    };

    return NextResponse.json(updatedSection, { status: 200 });
  } catch (error) {
    console.error('[COMPLIANCE_UPDATE_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
