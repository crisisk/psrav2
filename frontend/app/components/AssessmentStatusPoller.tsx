'use client';
import { useEffect, useState } from 'react';

type StatusResponse = {
  assessmentId: string;
  completed: boolean;
  progress?: number;
  message?: string;
};

interface PollerProps {
  assessmentId: string;
  interval?: number;
  maxAttempts?: number;
}

export default function AssessmentStatusPoller({
  assessmentId,
  interval = 5000,
  maxAttempts = 20
}: PollerProps) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const checkStatus = async () => {
      try {
        const response = await fetch(
          `/api/assessment/${assessmentId}/status`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: StatusResponse = await response.json();
        if (isMounted) {
          setStatus(data);
          setError(null);
          setIsLoading(false);

          if (data.completed || attempts >= maxAttempts) {
            clearInterval(intervalId);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Polling failed');
          setIsLoading(false);
          clearInterval(intervalId);
        }
      } finally {
        if (isMounted) {
          setAttempts(prev => prev + 1);
        }
      }
    };

    const intervalId = setInterval(checkStatus, interval);
    checkStatus(); // Initial check

    return () => {
      isMounted = false;
      controller.abort();
      clearInterval(intervalId);
    };
  }, [assessmentId, interval, maxAttempts, attempts]);

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
      {isLoading ? (
        <div className="flex items-center gap-2 text-blue-600">
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Initializing status check...</span>
        </div>
      ) : status?.completed ? (
        <div className="text-green-600">
          <p>✅ Assessment completed!</p>
          <p className="text-sm mt-1">{status.message}</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-600">
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Checking status... (Attempt {attempts}/{maxAttempts})</span>
          </div>
          {status?.progress && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${status.progress}%` }}
              />
            </div>
          )}
          <p className="text-sm text-blue-600">{status?.message}</p>
        </div>
      )}
    </div>
  );
}
