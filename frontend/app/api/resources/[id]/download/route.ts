import { NextResponse } from 'next/server';
import { join } from 'path';
import fs from 'fs/promises';
import { validateUUID } from '@/lib/validation';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validate resource ID format
    if (!validateUUID(params.id)) {
      return NextResponse.json(
        { error: 'Invalid resource ID format' },
        { status: 400 }
      );
    }

    // In production: Replace with actual file retrieval logic
    // Mock file path - ensure this path is secure in real implementations
    const mockFilePath = join(process.cwd(), 'lib', 'resources', `${params.id}.pdf`);
    
    // Check if file exists
    try {
      await fs.access(mockFilePath);
    } catch {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    // Read file and create stream
    const fileBuffer = await fs.readFile(mockFilePath);
    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${params.id}.pdf"`);
    headers.set('Content-Type', 'application/pdf');

    return new NextResponse(fileBuffer as unknown as BodyInit, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('[RESOURCE_DOWNLOAD_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
