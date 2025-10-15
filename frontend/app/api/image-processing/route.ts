import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

// Define type for successful response
interface ProcessedImageResponse {
  success: true;
  imageBuffer: string;  // Base64 encoded
  width: number;
  height: number;
  format: string;
  size: number;
}

// Define type for error response
interface ErrorResponse {
  success: false;
  error: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<ProcessedImageResponse | ErrorResponse>> {
  try {
    // Get form data from request
    const formData = await req.formData();
    const file = formData.get('image') as File | null;

    // Validate file existence and type
    if (!file || !file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'No valid image file provided' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process image with sharp
    const processor = sharp(buffer)
      .resize({
        width: 1200,
        height: 1200,
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 80 });

    // Get metadata and processed buffer
    const { width, height, format } = await processor.metadata();
    const processedBuffer = await processor.toBuffer();

    // Validate processing results
    if (!width || !height || !format) {
      throw new Error('Failed to process image metadata');
    }

    return NextResponse.json({
      success: true,
      imageBuffer: processedBuffer.toString('base64'),
      width,
      height,
      format,
      size: processedBuffer.byteLength
    });

  } catch (error) {
    console.error('Image processing error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process image' },
      { status: 500 }
    );
  }
}
