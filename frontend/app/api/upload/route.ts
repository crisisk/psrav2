import { NextResponse } from 'next/server';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { s3Client, AWS_BUCKET_NAME } from '@/lib/config/s3';
import { z } from 'zod';

const schema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().regex(/^\w+\/[-+.\w]+$/),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = schema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors },
        { status: 400 }
      );
    }

    const { fileName, fileType } = validation.data;

    const { url, fields } = await createPresignedPost(s3Client, {
      Bucket: AWS_BUCKET_NAME,
      Key: `uploads/${Date.now()}-${fileName}`,
      Conditions: [['starts-with', '$Content-Type', fileType]],
      Fields: {
        'Content-Type': fileType,
      },
      Expires: 600, // 10 minutes
    });

    return NextResponse.json({ url, fields });
  } catch (error) {
    console.error('Upload presign error:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}