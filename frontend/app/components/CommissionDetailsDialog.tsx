'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

type CommissionDetails = {
  id: string;
  title: string;
  status: string;
  price: number;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export function CommissionDetailsDialog({ commissionId }: { commissionId: string }) {
  const [open, setOpen] = useState(false);
  const [details, setDetails] = useState<CommissionDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!open) return;

      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/commissions/${commissionId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setDetails(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load details');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [open, commissionId]);

  return (
    <Modal isOpen={open} onClose={() => setOpen(false)} title="Commission Details">
      <div onClick={() => setOpen(true)}>
        <Button variant="ghost" className="text-blue-600 hover:text-blue-800 p-0">
          View Details
        </Button>
      </div>

      <div className="p-6">
        {loading && (
          <div className="text-center py-4">Loading commission details...</div>
        )}

        {error && (
          <div className="text-red-500 text-center py-4">
            Error: {error}
          </div>
        )}

        {details && (
          <div className="grid gap-4">
            <div className="border-b pb-2">
              <h3 className="text-lg font-semibold">{details.title}</h3>
              <p className="text-sm text-gray-500">ID: {details.id}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <DetailItem label="Status" value={details.status} />
              <DetailItem label="Price" value={`$${details.price.toFixed(2)}`} />
              <DetailItem
                label="Created"
                value={new Date(details.createdAt).toLocaleDateString()}
              />
              <DetailItem
                label="Last Updated"
                value={new Date(details.updatedAt).toLocaleDateString()}
              />
            </div>

            <div className="space-y-1">
              <p className="font-medium text-sm">Description:</p>
              <p className="text-sm text-gray-600">{details.description}</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  );
}