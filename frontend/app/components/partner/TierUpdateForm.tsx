'use client'

import { useState, useEffect } from 'react'
import { Partner, Tier } from '@/lib/types'
import { Loader2 } from 'lucide-react'

type TierUpdateFormProps = {
  partnerId: string
  currentTier: { name: string }
  onSuccess?: () => void
  onClose: () => void
}

export function TierUpdateForm({
  partnerId,
  currentTier,
  onSuccess,
  onClose
}: TierUpdateFormProps) {
  const tiers = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
  const [selectedTier, setSelectedTier] = useState<string>(currentTier.name)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/partners/${partnerId}/tier`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: selectedTier })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Update failed')
      }

      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('Tier update failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to update tier')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg p-6 max-w-md w-full">
      <h2 className="text-xl font-semibold mb-4">Update Partner Tier</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Select Tier
          </label>
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            disabled={isSubmitting}
          >
            {tiers.map((tier) => (
              <option key={tier} value={tier}>
                {tier.charAt(0) + tier.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="mb-4 text-red-600 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
            disabled={isSubmitting}
          >
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Update Tier
          </button>
        </div>
      </form>
    </div>
  )
}
