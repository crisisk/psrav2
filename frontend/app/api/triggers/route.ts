import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

// Zod schema for trigger validation
const triggerSchema = z.object({
  eventType: z.string().min(1, 'Event type is required'),
  condition: z.string().min(1, 'Condition is required'),
  action: z.string().min(1, 'Action is required'),
});

export async function GET() {
  try {
    // Simulate database fetch
    const triggers = await db.trigger.findMany();
    return NextResponse.json({ data: triggers });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch triggers' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = triggerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors },
        { status: 400 }
      );
    }

    // Simulate database creation
    const newTrigger = await db.trigger.create({
      data: validation.data,
    });

    return NextResponse.json(
      { data: newTrigger },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Trigger creation failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    // Simulate database deletion
    await db.trigger.delete({ where: { id } });
    return NextResponse.json(
      { message: 'Trigger deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Trigger deletion failed' },
      { status: 500 }
    );
  }
}
