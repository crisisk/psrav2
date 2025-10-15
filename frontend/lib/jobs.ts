// Job queue service with in-memory storage

type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Job {
  id: string;
  status: JobStatus;
  createdAt: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
}

class JobService {
  private jobs: Map<string, Job> = new Map();

  createJob(): Job {
    const job: Job = {
      id: Math.random().toString(36).substring(2, 9),
      status: 'pending',
      createdAt: new Date(),
    };

    this.jobs.set(job.id, job);
    this.processJob(job.id);
    return job;
  }

  getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  private async processJob(id: string): Promise<void> {
    const job = this.jobs.get(id);
    if (!job) return;

    try {
      // Simulate background processing
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Update job status
      job.status = 'completed';
      job.completedAt = new Date();
      job.result = { message: 'Assessment completed successfully' };
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
    }
  }
}

// Singleton instance
export const jobService = new JobService();