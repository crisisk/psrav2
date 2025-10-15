import { NextResponse } from 'next/server';
import { z } from 'zod';

const NoteSchema = z.object({
  content: z.string().min(1, 'Note content is required'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = NoteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // In real implementation: Replace with actual database insert
    const newNote = {
      id: Date.now(),
      ...validation.data,
      createdAt: new Date(),
    };

    return NextResponse.json(newNote, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}