'use client';

import { useState, useEffect } from 'react';

export default function JobTracker() {
  const [jobId, setJobId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const startJob = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to start assessment');
      }

      const { jobId } = await response.json();
      setJobId(jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start job');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!jobId) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`);
        if (!response.ok) throw new Error('Status check failed');
        
        const job = await response.json();
        setStatus(job.status);

        if (job.status === 'completed' || job.status === 'failed') {
          clearInterval(interval);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Status update failed');
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Conformity Assessment</h2>
      
      <button
        onClick={startJob}
        disabled={isLoading}
        className={`px-4 py-2 rounded-md text-white ${
          isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isLoading ? 'Starting Assessment...' : 'Start New Assessment'}
      </button>

      {jobId && (
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <p className="font-medium">Job ID: {jobId}</p>
          <p className="mt-2">Status: {status || 'Pending'}</p>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          Error: {error}
        </div>
      )}
    </div>
  );
}