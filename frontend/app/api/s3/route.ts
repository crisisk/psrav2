import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { z } from 'zod';

// Initialize S3 client with environment variables
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const requestSchema = z.object({
  fileName: z.string().min(1).max(255),
  action: z.enum(['upload', 'download']),
});

export async function POST(req: NextRequest) {
  try {
    // Validate environment variables
    if (!process.env.AWS_S3_BUCKET_NAME) {
      throw new Error('S3 bucket name not configured');
    }

    // Parse and validate request body
    const body = await req.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors },
        { status: 400 }
      );
    }

    const { fileName, action } = validation.data;
    const bucketName = process.env.AWS_S3_BUCKET_NAME;

    let command;
    if (action === 'upload') {
      command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        ContentType: 'application/octet-stream',
      });
    } else {
      command = new GetObjectCommand({
        Bucket: bucketName,
        Key: fileName,
      });
    }

    // Generate signed URL with 15-minute expiration
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 900,
    });

    return NextResponse.json({ url: signedUrl });
  } catch (error) {
    console.error('S3 Signed URL Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate signed URL' },
      { status: 500 }
    );
  }
}
