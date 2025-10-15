'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { type Lead } from '@/types/lead';
import { toast } from '@/lib/toast';

type Props = {
  lead: Lead;
};

export const ConvertLeadButton = ({ lead }: Props) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleConvert = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}/convert`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update lead status');
      }

      toast.success('Lead marked as converted');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const isConverted = lead.status === 'converted';

  return (
    <button
      onClick={handleConvert}
      disabled={isConverted || isLoading}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors
        ${isConverted
          ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
          : 'bg-green-600 text-white hover:bg-green-700'
        }
        ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
    >
      {isConverted ? 'Converted' : isLoading ? 'Processing...' : 'Mark as Converted'}
    </button>
  );
};
