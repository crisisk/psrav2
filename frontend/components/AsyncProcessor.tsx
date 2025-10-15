'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

interface JobStatus {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  result?: {
    reportUrl: string;
  };
}

export function AsyncProcessor({ assessmentId }: { assessmentId: string }) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('idle');
  const [error, setError] = useState<string | null>(null);

  const startProcessing = async () => {
    try {
      setStatus('starting');
      const response = await fetch('/api/async-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId })
      });

      if (!response.ok) {
        throw new Error('Failed to start processing');
      }

      const { jobId } = await response.json();
      setJobId(jobId);
      setStatus('processing');
    } catch (err) {
      console.error(err);
      setError('Failed to start processing');
      setStatus('idle');
    }
  };

  useEffect(() => {
    if (!jobId || status !== 'processing') return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/async-process/${jobId}`);
        if (!response.ok) throw new Error('Polling failed');

        const data: JobStatus = await response.json();
        
        if (data.status === 'completed') {
          setStatus('completed');
          clearInterval(pollInterval);
        } else if (data.status === 'failed') {
          setError('Processing failed');
          setStatus('failed');
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error(err);
        clearInterval(pollInterval);
        setError('Polling failed');
        setStatus('failed');
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [jobId, status]);

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <div className="flex items-center gap-4">
        <Button
          onClick={startProcessing}
          disabled={status !== 'idle'}
          className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
        >
          {status === 'idle' ? 'Start Assessment' : 'Processing...'}
        </Button>

        {status === 'completed' && (
          <span className="text-green-600">✅ Processing complete!</span>
        )}
        {status === 'failed' && (
          <span className="text-red-600">❌ Processing failed</span>
        )}
        {error && (
          <span className="text-red-600">{error}</span>
        )}
      </div>

      {status === 'processing' && (
        <div className="mt-2 text-sm text-gray-600">
          ⏳ Processing job: {jobId}
        </div>
      )}
    </div>
  );
}
