'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';

type Props = {
  selectedLogIds: string[];
};

export function AuditLogApproveButton({ selectedLogIds }: Props) {
  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async () => {
    if (!selectedLogIds.length) return;

    setIsApproving(true);

    try {
      const response = await fetch('/api/audit-logs/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logIds: selectedLogIds }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      alert(`Successfully approved ${result.approvedCount} items`);
      window.location.reload(); // Refresh data
    } catch (error) {
      console.error('Approval failed:', error);
      alert('Approval failed. Please try again.');
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <Button
      onClick={handleApprove}
      disabled={!selectedLogIds.length || isApproving}
      className="ml-2 bg-green-600 hover:bg-green-700 disabled:opacity-50"
    >
      {isApproving ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Approving...
        </>
      ) : (
        'Approve Selected'
      )}
    </Button>
  );
}
