import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

interface ErrorResponse {
  error: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<Blob | ErrorResponse>> {
  try {
    // Validate request method
    if (request.method !== 'POST') {
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    // Validate file existence
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type' },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Process image with Sharp
    const optimizedBuffer = await sharp(buffer)
      .resize({
        width: 800,
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();

    // Return optimized image
    return new NextResponse(optimizedBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'image/webp',
        'Content-Disposition': 'inline; filename="optimized-image.webp"'
      },
    });

  } catch (error) {
    console.error('Image processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
