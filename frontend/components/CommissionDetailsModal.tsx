'use client';

import { useState, useEffect } from 'react';
import { Commission } from '@/lib/types';
import { Spinner } from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AlertTriangle } from 'lucide-react';

type CommissionDetailsModalProps = {
  commissionId: number;
  children: React.ReactNode;
};

export function CommissionDetailsModal({
  commissionId,
  children
}: CommissionDetailsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [commission, setCommission] = useState<Commission | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCommissionDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/commissions/${commissionId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch commission details');
      }

      const { data }: { data: Commission } = await response.json();
      setCommission(data);
    } catch (err) {
      console.error('Failed to load commission details:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCommissionDetails();
    }
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-primary hover:underline"
      >
        {children}
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Commission Details">
        <div className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">
              Commission Details
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner className="h-8 w-8" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-4 py-8 text-destructive">
              <AlertTriangle className="h-12 w-12" />
              <p className="text-center">{error}</p>
              <Button variant="outline" onClick={fetchCommissionDetails}>
                Retry
              </Button>
            </div>
          ) : (
            commission && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <DetailItem label="Status" value={commission.status} />
                  <DetailItem label="Created At" value={new Date(commission.createdAt).toLocaleDateString()} />
                  <DetailItem label="Assigned To" value={commission.assignedTo?.name || 'Unassigned'} />
                  <DetailItem label="Documents" value={commission.documents.length.toString()} />
                </div>
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-2">Milestones:</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    {commission.milestones.map((milestone) => (
                      <li key={milestone.id}>
                        {milestone.name} - {milestone.status}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          )}
        </div>
      </Modal>
    </>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
