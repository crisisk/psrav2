'use client'

import { useState } from 'react'

type NotificationButtonProps = {
  auditLogId: string
  userId: string
}

export function ManagementNotification({ auditLogId, userId }: NotificationButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleNotifyManagement = async () => {
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/management-notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ auditLogId, userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to notify management')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleNotifyManagement}
        disabled={isLoading}
        className={`px-4 py-2 rounded-md ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors`}
      >
        {isLoading ? 'Sending...' : 'Notify Management Team'}
      </button>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {success && (
        <p className="text-green-500 text-sm">
          Management team has been notified successfully
        </p>
      )}
    </div>
  )
}
