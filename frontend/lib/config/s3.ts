import { S3Client } from '@aws-sdk/client-s3';
import { fromEnv } from '@aws-sdk/credential-provider-env';

// S3 client configuration with environment variables
export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-west-1',
  credentials: fromEnv(),
});

// Validate required environment variables
if (!process.env.AWS_BUCKET_NAME) {
  throw new Error('AWS_BUCKET_NAME environment variable is required');
}

export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME;