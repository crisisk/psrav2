'use client';
import { useState } from 'react';
import { PartnerTier } from '@/lib/types/partner';

type Props = {
  partnerId: string;
  currentTier: PartnerTier['tier'];
};

export default function PartnerTierForm({ partnerId, currentTier }: Props) {
  const [selectedTier, setSelectedTier] = useState(currentTier);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch(`/api/partners/${partnerId}/tier`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: selectedTier })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update tier');
      }

      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Select Tier:
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value as any)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            disabled={status === 'loading'}
          >
            <option value="bronze">Bronze</option>
            <option value="silver">Silver</option>
            <option value="gold">Gold</option>
          </select>
        </label>
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className={`px-4 py-2 rounded-md text-white ${status === 'loading' ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {status === 'loading' ? 'Updating...' : 'Update Tier'}
      </button>

      {status === 'success' && (
        <p className="text-green-600">Tier updated successfully!</p>
      )}

      {status === 'error' && (
        <p className="text-red-600">Error: {errorMessage}</p>
      )}
    </form>
  );
}
