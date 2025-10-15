'use client'

import { useEffect, useState } from 'react'

type NotificationType = {
  id: string
  errorMessage: string
  timestamp: string
}

interface NotificationBannerProps {
  errorId?: string
}

export function NotificationBanner({ errorId }: NotificationBannerProps) {
  const [notification, setNotification] = useState<NotificationType | null>(null)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (errorId) {
      const fetchNotification = async () => {
        try {
          const response = await fetch(`/api/notifications/${errorId}`)
          if (!response.ok) throw new Error('Failed to fetch notification')
          const data = await response.json()
          setNotification(data)
        } catch (error) {
          console.error('Notification fetch error:', error)
        }
      }
      fetchNotification()
    }
  }, [errorId])

  const handleClose = () => setIsVisible(false)

  if (!isVisible || !notification) return null

  return (
    <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-4 flex justify-between items-center">
      <div>
        <h3 className="font-semibold">Auto-generation failed</h3>
        <p className="text-sm">{notification.errorMessage}</p>
        <time className="text-xs opacity-75">
          {new Date(notification.timestamp).toLocaleString()}
        </time>
      </div>
      <button
        onClick={handleClose}
        className="text-red-600 hover:text-red-800 transition-colors"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  )
}

export async function handleAutoGenerationFailure(error: Error, userId: string) {
  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        errorMessage: error.message,
        userId,
      }),
    })

    if (!response.ok) throw new Error('Failed to send notification')

    const { data } = await response.json()
    return data.id
  } catch (err) {
    console.error('Notification submission error:', err)
    return null
  }
}
