import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type NotePayload = {
  leadId: string;
  text: string;
};

// GET all notes for specific lead
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');

    if (!leadId) {
      return NextResponse.json(
        { error: 'leadId query parameter is required' },
        { status: 400 }
      );
    }

    const notes = await prisma.leadNote.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(notes);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch lead notes' },
      { status: 500 }
    );
  }
}

// CREATE new note
export async function POST(request: Request) {
  try {
    const body: NotePayload = await request.json();
    
    if (!body.leadId || !body.text) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (body.text.length > 500) {
      return NextResponse.json(
        { error: 'Note exceeds 500 character limit' },
        { status: 400 }
      );
    }

    const newNote = await prisma.leadNote.create({
      data: {
        leadId: body.leadId,
        text: body.text,
      },
    });

    return NextResponse.json(newNote, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}

// DELETE note
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Note ID required' },
        { status: 400 }
      );
    }

    await prisma.leadNote.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete note' },
      { status: 500 }
    );
  }
}