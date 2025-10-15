'use client';

import { useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';

type PaymentStatus = {
  status: 'paid' | 'pending' | 'overdue';
  amount: number;
  dueDate: string;
  reference: string;
};

export default function PaymentStatus({ assessmentId }: { assessmentId: string }) {
  const [statusData, setStatusData] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPaymentStatus = async () => {
      try {
        const response = await fetch(
          `/api/payments/status?assessmentId=${encodeURIComponent(assessmentId)}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: PaymentStatus = await response.json();
        setStatusData({
          ...data,
          dueDate: new Date(data.dueDate).toLocaleDateString('nl-NL'),
        });
      } catch (err) {
        console.error('Payment status fetch failed:', err);
        setError('Failed to load payment status');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentStatus();
  }, [assessmentId]);

  const statusStyles = {
    paid: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    overdue: 'bg-red-100 text-red-800',
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Spinner className="h-4 w-4" />
        Loading payment status...
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Payment Details</h3>
        {statusData && (
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${statusStyles[statusData.status]}`}
          >
            {statusData.status}
          </span>
        )}
      </div>

      {statusData && (
        <dl className="grid grid-cols-2 gap-4">
          <div>
            <dt className="text-sm text-gray-500">Amount</dt>
            <dd className="font-medium">€{statusData.amount.toLocaleString('nl-NL')}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Due Date</dt>
            <dd className="font-medium">{statusData.dueDate}</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-sm text-gray-500">Reference</dt>
            <dd className="font-medium">{statusData.reference}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}
