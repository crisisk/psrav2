import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// In-memory store for demonstration (replace with database in production)
// Moved to lib/job-store.ts
import { jobStore } from "@/lib/job-store";
// const jobStore = new Map<string, { status: 'processing' | 'completed' | 'failed'; result?: any }>();

interface ProcessRequest {
  assessmentId: string;
  parameters: Record<string, any>;
}

export async function POST(request: Request) {
  try {
    const data: ProcessRequest = await request.json();

    // Validation
    if (!data.assessmentId || typeof data.assessmentId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid assessment ID' },
        { status: 400 }
      );
    }

    const jobId = uuidv4();
    jobStore.set(jobId, { status: 'processing' });

    // Simulate async processing
    setTimeout(() => {
      jobStore.set(jobId, { 
        status: Math.random() > 0.1 ? 'completed' : 'failed',
        result: { reportUrl: `/reports/${jobId}` }
      });
    }, 5000);

    return NextResponse.json({ jobId });
  } catch (error) {
    console.error('Async process error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
