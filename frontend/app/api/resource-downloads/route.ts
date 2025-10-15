import { NextResponse, NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Validation schema for request body
const DownloadSchema = z.object({
  resourceId: z.string().uuid(),
  userId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    // Validate request body
    const body = await req.json();
    const validation = DownloadSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors },
        { status: 400 }
      );
    }

    // Create download record
    const download = await prisma.resource_downloads.create({
      data: {
        resource_id: validation.data.resourceId,
        user_id: validation.data.userId,
        downloaded_at: new Date(),
      },
    });

    return NextResponse.json(
      { message: 'Download recorded', download },
      { status: 201 }
    );
  } catch (error) {
    console.error('Download tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
