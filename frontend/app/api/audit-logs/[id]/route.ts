import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid ID format').transform(Number)
});

const putSchema = z.object({
  action: z.string().min(1, 'Action is required'),
  userId: z.string().min(1, 'User ID is required'),
  details: z.string().optional()
});

interface AuditLog {
  id: number;
  action: string;
  userId: string;
  details?: string;
  timestamp: Date;
}

// Mock database
const auditLogs: AuditLog[] = [
  { id: 1, action: 'CREATE', userId: 'user_123', timestamp: new Date() }
];

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const validation = paramsSchema.safeParse(params);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { id } = validation.data;
    const log = auditLogs.find(l => l.id === id);

    if (!log) {
      return NextResponse.json(
        { error: 'Audit log not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(log);
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate parameters
    const paramValidation = paramsSchema.safeParse(params);
    if (!paramValidation.success) {
      return NextResponse.json(
        { error: paramValidation.error.flatten() },
        { status: 400 }
      );
    }

    // Validate request body
    const body = await req.json();
    const bodyValidation = putSchema.safeParse(body);
    if (!bodyValidation.success) {
      return NextResponse.json(
        { error: bodyValidation.error.flatten() },
        { status: 400 }
      );
    }

    const { id } = paramValidation.data;
    const logIndex = auditLogs.findIndex(l => l.id === id);

    if (logIndex === -1) {
      return NextResponse.json(
        { error: 'Audit log not found' },
        { status: 404 }
      );
    }

    // Update log
    auditLogs[logIndex] = {
      ...auditLogs[logIndex],
      ...bodyValidation.data,
      timestamp: new Date()
    };

    return NextResponse.json(auditLogs[logIndex]);
  } catch (error) {
    console.error('PUT Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
