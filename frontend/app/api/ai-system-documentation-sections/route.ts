import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { AiDocumentationSection } from '@/lib/types/aiSystemDocumentationSection';

export async function GET() {
  try {
    const sections = await prisma.ai_system_documentation_sections.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(sections);
  } catch (error) {
    console.error('Failed to fetch sections:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body: Partial<AiDocumentationSection> = await request.json();
    
    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const newSection = await prisma.ai_system_documentation_sections.create({
      data: {
        title: body.title,
        content: body.content,
        status: body.status || 'draft',
      },
    });

    return NextResponse.json(newSection, { status: 201 });
  } catch (error) {
    console.error('Failed to create section:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body: AiDocumentationSection = await request.json();

    if (!body.id) {
      return NextResponse.json(
        { error: 'Section ID is required for update' },
        { status: 400 }
      );
    }

    const updatedSection = await prisma.ai_system_documentation_sections.update({
      where: { id: body.id },
      data: {
        title: body.title,
        content: body.content,
        status: body.status,
      },
    });

    return NextResponse.json(updatedSection);
  } catch (error) {
    console.error('Failed to update section:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Section ID is required' },
        { status: 400 }
      );
    }

    await prisma.ai_system_documentation_sections.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Section deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to delete section:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
