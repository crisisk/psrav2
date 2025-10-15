import { NextResponse } from 'next/server';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, AWS_BUCKET_NAME } from '@/lib/config/s3';

interface Params {
  params: {
    key: string;
  };
}

export async function GET(request: Request, { params }: Params) {
  try {
    const { key } = params;
    
    const command = new GetObjectCommand({
      Bucket: AWS_BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // 1 hour
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Download presign error:', error);
    return NextResponse.json(
      { error: 'Failed to generate download URL' },
      { status: 500 }
    );
  }
}