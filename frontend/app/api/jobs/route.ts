import { NextResponse } from 'next/server';
import { jobService } from '@/lib/jobs';

export async function POST() {
  try {
    const job = jobService.createJob();
    return NextResponse.json(
      { jobId: job.id },
      { status: 202 }
    );
  } catch (error) {
    console.error('Job creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create assessment job' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';