import { NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '@/lib/s3-client';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

type PresignedUrlResponse = {
  url?: string;
  error?: string;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get('fileName');
  const fileType = searchParams.get('fileType');

  if (!fileName || !fileType) {
    return NextResponse.json(
      { error: 'Missing fileName or fileType' } as PresignedUrlResponse,
      { status: 400 }
    );
  }

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      ContentType: fileType,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return NextResponse.json({ url } as PresignedUrlResponse);
  } catch (error) {
    console.error('S3 Presigned URL Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate presigned URL' } as PresignedUrlResponse,
      { status: 500 }
    );
  }
}
