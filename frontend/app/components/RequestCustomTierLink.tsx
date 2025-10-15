'use client';

import { useState } from 'react';

export default function RequestCustomTierLink() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRequest = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/request-custom-tier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'current-user-id', // In production: Get from session
          currentTier: 'basic',      // In production: Get from user data
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Request failed');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleRequest}
        disabled={isLoading}
        className={`text-blue-600 hover:text-blue-800 text-sm font-medium
          ${isLoading ? 'opacity-50 cursor-not-allowed' : 'underline'}
        `}
      >
        {isLoading ? 'Submitting...' : 'Request Custom Tier'}
      </button>

      {error && (
        <p className="text-red-600 text-sm mt-1">Error: {error}</p>
      )}

      {success && (
        <p className="text-green-600 text-sm mt-1">
          Request submitted successfully!
        </p>
      )}
    </div>
  );
}
