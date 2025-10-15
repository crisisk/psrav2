'use client';

import { useState } from 'react';

export interface DetailsButtonProps {
  commissionId: string;
}

export function DetailsButton({ commissionId }: DetailsButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleViewDetails = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/commissions/${commissionId}/payment-status`
      );

      if (!response.ok) {
        throw new Error('Failed to verify payment status');
      }

      const data = await response.json();

      if (data.isPaid) {
        // Redirect to commission details page
        window.location.href = `/commissions/${commissionId}`;
      } else {
        setError('Payment verification required to view details');
      }
    } catch (err) {
      console.error('Details request failed:', err);
      setError('Failed to verify commission status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleViewDetails}
        disabled={isLoading}
        className={`px-4 py-2 rounded-md text-white transition-colors
          ${isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
          }`}
      >
        {isLoading ? 'Checking...' : 'View Details'}
      </button>

      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
}
