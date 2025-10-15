import { NextResponse } from 'next/server';
import { z } from 'zod';

const requestSchema = z.object({
  auditLogId: z.string().uuid({ message: 'Invalid audit log ID format' })
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }

    // In production, you would typically log the view event to your database here
    // Example: await prisma.auditLogView.create({ data: { auditLogId: validation.data.auditLogId } })

    return NextResponse.json(
      { success: true, message: 'View logged successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Audit Log View Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
