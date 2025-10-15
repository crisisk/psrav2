'use client';
import { useState } from 'react';

type DisputeButtonProps = {
  commissionId: string;
  status: 'pending' | 'approved' | 'rejected';
};

export function DisputeButton({ commissionId, status }: DisputeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDispute = async () => {
    if (status !== 'pending') return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/commissions/dispute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ commissionId }),
      });

      if (!response.ok) {
        throw new Error('Dispute request failed');
      }

      // Refresh data or show success notification
      alert('Dispute submitted successfully');
    } catch (error) {
      console.error('Dispute error:', error);
      alert('Failed to submit dispute');
    } finally {
      setIsLoading(false);
    }
  };

  if (status !== 'pending') return null;

  return (
    <button
      onClick={handleDispute}
      disabled={isLoading}
      className={`px-4 py-2 text-sm rounded-md transition-colors
        ${isLoading 
          ? 'bg-gray-300 cursor-not-allowed' 
          : 'bg-red-600 text-white hover:bg-red-700'}
      `}
    >
      {isLoading ? 'Processing...' : 'Dispute'}
    </button>
  );
}
