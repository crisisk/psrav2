'use client'

import { useState } from 'react'

export default function StartAssessmentButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/assessments/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to start assessment')
      }

      const data = await response.json()
      // Redirect or update state as needed
      window.location.href = `/assessments/${data.id}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="w-full px-6 py-3 text-white bg-blue-600 rounded-lg
                   hover:bg-blue-700 transition-colors duration-200
                   disabled:bg-blue-300 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Starting...' : 'New Assessment'}
      </button>
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}
    </div>
  )
}
