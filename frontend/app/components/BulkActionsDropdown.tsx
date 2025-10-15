'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface BulkActionsDropdownProps {
  selectedItems: string[];
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export const BulkActionsDropdown = ({ selectedItems, onSuccess, onError }: BulkActionsDropdownProps) => {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedAction, setSelectedAction] = useState('');

  const handleAction = async (action: string) => {
    if (!selectedItems.length) return;

    setIsProcessing(true);
    setSelectedAction(action);

    try {
      const response = await fetch('/api/audit-logs/bulk-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          logIds: selectedItems
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      onSuccess?.();
      router.refresh();
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsProcessing(false);
      setSelectedAction('');
    }
  };

  if (!selectedItems.length) return null;

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center">
        <button
          disabled={isProcessing}
          onClick={() => handleAction(selectedAction)}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${
            isProcessing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
        >
          {isProcessing ? (
            `Processing ${selectedAction}...`
          ) : (
            'Bulk Actions'
          )}
        </button>

        <select
          disabled={isProcessing}
          value={selectedAction}
          onChange={(e) => handleAction(e.target.value)}
          className="ml-2 p-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Select Action</option>
          <option value="export">Export Selected</option>
          <option value="delete">Delete Selected</option>
          <option value="archive">Archive Selected</option>
        </select>
      </div>
    </div>
  );
};
