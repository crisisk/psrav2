import { NextResponse } from 'next/server';
import { z } from 'zod';

// Zod schema for metadata validation (not exported from route)
const AISystemMetadataSchema = z.object({
  dataSource: z.string().min(1, 'Data source is required'),
  generationDate: z.string().datetime(),
  version: z.string().min(1, 'Version is required'),
  origin: z.enum(['manual', 'automated', 'third-party']),
  checksum: z.string().optional(),
});

export type AISystemMetadata = z.infer<typeof AISystemMetadataSchema>;

// Temporary in-memory storage for demonstration
let systemMetadata: AISystemMetadata[] = [
  {
    dataSource: 'EU Database',
    generationDate: '2024-01-15T09:00:00Z',
    version: '1.0.0',
    origin: 'automated',
    checksum: 'a1b2c3d4',
  },
];

// GET handler for fetching metadata
export async function GET() {
  try {
    return NextResponse.json({ data: systemMetadata });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch metadata' },
      { status: 500 }
    );
  }
}

// POST handler for creating new metadata entries
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = AISystemMetadataSchema.parse(body);

    systemMetadata.push(validatedData);

    return NextResponse.json(
      { success: true, data: validatedData },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
