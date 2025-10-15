'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type CommissionTriggerProps = {
  dealId: string;
};

export function CommissionTrigger({ dealId }: CommissionTriggerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleCommission = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/commissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ dealId })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Commission calculation failed');
      }

      setSuccess(true);
      router.refresh(); // Refresh page data after successful commission
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleCommission}
        disabled={isLoading}
        className={`px-4 py-2 rounded-md ${isLoading 
          ? 'bg-gray-400 cursor-not-allowed' 
          : 'bg-green-600 hover:bg-green-700 text-white'}`}
      >
        {isLoading ? 'Processing...' : 'Calculate Commission'}
      </button>

      {success && (
        <p className="text-green-600 text-sm">
          Commission successfully calculated!
        </p>
      )}

      {error && (
        <p className="text-red-600 text-sm">
          Error: {error}
        </p>
      )}
    </div>
  );
}
