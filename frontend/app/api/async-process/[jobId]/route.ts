import { NextResponse } from 'next/server';

// In-memory store import from parent route
import { jobStore } from "@/lib/job-store";

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;

    if (!jobStore.has(jobId)) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    const job = jobStore.get(jobId);
    return NextResponse.json({
      jobId,
      status: job?.status,
      result: job?.result
    });
  } catch (error) {
    console.error('Job status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
