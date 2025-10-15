'use client';

import { useEffect, useState } from 'react';
import { CommissionDispute } from '@/lib/types/commissionDispute';

export default function CommissionDisputesList() {
  const [disputes, setDisputes] = useState<CommissionDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDisputes = async () => {
      try {
        const response = await fetch('/api/commission-disputes');
        if (!response.ok) throw new Error('Failed to fetch disputes');
        const data = await response.json();
        setDisputes(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchDisputes();
  }, []);

  if (loading) return <div className='p-4 text-gray-500'>Loading disputes...</div>;
  if (error) return <div className='p-4 text-red-500'>Error: {error}</div>;

  return (
    <div className='p-4'>
      <h2 className='text-xl font-semibold mb-4'>Commission Disputes</h2>
      <div className='space-y-4'>
        {disputes.map((dispute) => (
          <div
            key={dispute.id}
            className='p-4 bg-white rounded-lg shadow-sm border border-gray-200'
          >
            <div className='flex justify-between items-start mb-2'>
              <h3 className='font-medium text-gray-800'>{dispute.title}</h3>
              <span className={`px-2 py-1 text-sm rounded-full ${statusColor(dispute.status)}`}>
                {dispute.status}
              </span>
            </div>
            <p className='text-gray-600 text-sm mb-2'>{dispute.description}</p>
            <div className='flex justify-between items-center text-sm'>
              <span className='text-gray-500'>Amount: €{dispute.amount.toFixed(2)}</span>
              <span className='text-gray-400 text-xs'>
                Created: {new Date(dispute.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function statusColor(status: string) {
  switch (status) {
    case 'OPEN':
      return 'bg-blue-100 text-blue-800';
    case 'IN_REVIEW':
      return 'bg-yellow-100 text-yellow-800';
    case 'RESOLVED':
      return 'bg-green-100 text-green-800';
    case 'CLOSED':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
