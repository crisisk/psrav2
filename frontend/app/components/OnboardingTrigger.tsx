'use client';

import { useState } from 'react';
import { z } from 'zod';

const triggerSchema = z.object({
  workflowId: z.string().uuid(),
  success: z.boolean(),
  message: z.string()
});

export function OnboardingTrigger({ userId }: { userId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const handleTrigger = async () => {
    setIsLoading(true);
    setMessage(null);
    setIsError(false);

    try {
      const response = await fetch('/api/onboarding/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          userId,
          workflowType: 'new_hire'
        })
      });

      const data = await response.json();
      const validation = triggerSchema.safeParse(data);

      if (!response.ok || !validation.success) {
        throw new Error(data.error || 'Failed to trigger workflow');
      }

      setMessage('Onboarding workflow started successfully');
      setIsError(false);
    } catch (error) {
      console.error('Trigger error:', error);
      setMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <button
        onClick={handleTrigger}
        disabled={isLoading}
        className={`px-4 py-2 rounded-md text-white ${isLoading 
          ? 'bg-gray-400 cursor-not-allowed' 
          : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {isLoading ? 'Starting...' : 'Start Onboarding Workflow'}
      </button>

      {message && (
        <div className={`mt-3 p-3 rounded-md ${isError 
          ? 'bg-red-100 text-red-700' 
          : 'bg-green-100 text-green-700'}`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
