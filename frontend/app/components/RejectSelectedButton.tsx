'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Props {
  selectedIds: string[];
  onSuccess?: () => void;
}

export function RejectSelectedButton({ selectedIds, onSuccess }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDisabled, setIsDisabled] = useState(true);

  useEffect(() => {
    setIsDisabled(selectedIds.length === 0 || isSubmitting);
  }, [selectedIds, isSubmitting]);

  const handleReject = async () => {
    setIsSubmitting(true);
    
    try {
      const promise = fetch('/api/audit-logs/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });

      await toast.promise(promise, {
        loading: 'Rejecting selected items...',
        success: (res) => {
          if (!res.ok) throw new Error('Failed to reject items');
          return 'Items rejected successfully';
        },
        error: (err) => err.message || 'Failed to reject items'
      });

      onSuccess?.();

    } catch (error) {
      console.error('Rejection error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      onClick={handleReject}
      disabled={isDisabled}
      className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors
        ${isDisabled
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-red-600 hover:bg-red-700'}
        ${isSubmitting ? 'opacity-75 cursor-wait' : ''}`}
    >
      {isSubmitting ? 'Processing...' : 'Reject Selected'}
    </button>
  );
}
