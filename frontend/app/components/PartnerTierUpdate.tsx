'use client';

import { useState, useCallback } from 'react';
import { Tier } from '@/lib/types';

type PartnerTierUpdateProps = {
  partnerId: string;
  currentTier: { name: string };
};

export const PartnerTierUpdate = ({ partnerId, currentTier }: PartnerTierUpdateProps) => {
  const [selectedTier, setSelectedTier] = useState<string>(currentTier.name);
  const [auditNote, setAuditNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const tiers: string[] = ['bronze', 'silver', 'gold', 'platinum'];

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(`/api/partners/${partnerId}/tier`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tier: selectedTier,
          auditNote: auditNote.trim()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update tier');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Update failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to update tier');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedTier, auditNote, partnerId]);

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Partner Tier
        </label>
        <select
          value={selectedTier}
          onChange={(e) => setSelectedTier(e.target.value)}
          className="w-full p-2 border rounded-md bg-white"
          disabled={isSubmitting}
        >
          {tiers.map((tier) => (
            <option key={tier} value={tier}>
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Audit Note
        </label>
        <textarea
          value={auditNote}
          onChange={(e) => setAuditNote(e.target.value)}
          className="w-full p-2 border rounded-md"
          rows={3}
          required
          disabled={isSubmitting}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`px-4 py-2 text-white rounded-md ${isSubmitting
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {isSubmitting ? 'Updating...' : 'Update Tier'}
      </button>

      {error && (
        <div className="p-3 text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 text-green-700 bg-green-100 rounded-md">
          Tier updated successfully!
        </div>
      )}
    </form>
  );
};
