import { NextResponse } from 'next/server';
import { jobService } from '@/lib/jobs';

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const job = jobService.getJob(params.jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Job status check failed:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve job status' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';