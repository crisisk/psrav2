'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type SaveContinueProps = {
  currentStep: number
  formData: Record<string, unknown>
}

export default function SaveContinueButton({
  currentStep,
  formData
}: SaveContinueProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/assessments/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentStep, formData })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save progress')
      }

      const data = await response.json()
      if (data.nextStep) {
        router.push(`/assessment/step/${data.nextStep}`)
      }
    } catch (err) {
      console.error('Save failed:', err)
      setError(err instanceof Error ? err.message : 'Failed to save progress')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mt-8 space-y-2">
      <button
        onClick={handleSave}
        disabled={isLoading}
        className={`w-full md:w-auto px-6 py-3 text-sm font-medium text-white rounded-md transition-colors
          ${isLoading
            ? 'bg-blue-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
          }`}
      >
        {isLoading ? 'Saving...' : 'Save & Continue'}
      </button>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  )
}
