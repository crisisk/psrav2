'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

type Props = {
  leadId: string;
  initialStatus: string;
};

export default function MarkAsConvertedButton({ leadId, initialStatus }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const isConverted = initialStatus === 'CONVERTED';

  const handleConversion = async () => {
    if (isConverted) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/leads/${leadId}/convert`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark lead as converted');
      }

      toast.success('Lead marked as converted!');
      window.location.reload(); // Refresh to update audit log
    } catch (error) {
      console.error('Conversion error:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleConversion}
      disabled={isConverted || isLoading}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors
        ${isConverted 
          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
          : isLoading
            ? 'bg-emerald-400 text-white cursor-wait'
            : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
    >
      {isConverted ? 'Converted' : isLoading ? 'Processing...' : 'Mark as Converted'}
    </button>
  );
}
