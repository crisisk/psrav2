'use client';

import { useState } from 'react';
import { CreateCommissionDisputeDTO } from '@/lib/types/commissionDispute';

export default function ClientDisputeForm() {
  const [formData, setFormData] = useState<CreateCommissionDisputeDTO>({
    title: '',
    description: '',
    amount: 0,
    userId: '',
    commissionId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/commission-disputes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create dispute');
      }

      setSuccess(true);
      setFormData({
        title: '',
        description: '',
        amount: 0,
        userId: '',
        commissionId: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='p-4 bg-gray-50 rounded-lg'>
      <h3 className='text-lg font-medium mb-4'>New Commission Dispute</h3>
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Title
          </label>
          <input
            type='text'
            required
            className='w-full p-2 border rounded-md'
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Description
          </label>
          <textarea
            required
            className='w-full p-2 border rounded-md'
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div>
          <label className='block text-sm font-medium text-gray-700 mb-1'>
            Amount
          </label>
          <input
            type='number'
            required
            className='w-full p-2 border rounded-md'
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
          />
        </div>

        {error && <div className='text-red-500 text-sm'>{error}</div>}
        {success && (
          <div className='text-green-500 text-sm'>
            Dispute created successfully!
          </div>
        )}

        <button
          type='submit'
          disabled={submitting}
          className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400'
        >
          {submitting ? 'Submitting...' : 'Create Dispute'}
        </button>
      </form>
    </div>
  );
}
