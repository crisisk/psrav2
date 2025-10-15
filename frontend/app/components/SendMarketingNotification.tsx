'use client'

import { useState } from 'react'
import { z } from 'zod'

type NotificationData = {
  message: string
  category: string
  urgency?: 'low' | 'medium' | 'high'
}

export default function SendMarketingNotification() {
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState('')
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateInputs = () => {
    try {
      NotificationSchema.parse({ message, category, urgency })
      return true
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message)
      }
      return false
    }
  }

  const handleSubmit = async () => {
    setError(null)
    setIsLoading(true)

    if (!validateInputs()) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, category, urgency }),
      })

      if (!response.ok) {
        throw new Error('Failed to send notification')
      }

      setMessage('')
      setCategory('')
      setUrgency('medium')
    } catch (err) {
      console.error('Notification error:', err)
      setError('Failed to send notification. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const NotificationSchema = z.object({
    message: z.string().min(1, 'Message is required'),
    category: z.string().min(1, 'Category is required'),
    urgency: z.enum(['low', 'medium', 'high']).default('medium'),
  })

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4">Notify Marketing Team</h2>
      
      {error && (
        <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-2 border rounded-md"
            rows={3}
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2 border rounded-md"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Urgency</label>
          <select
            value={urgency}
            onChange={(e) => setUrgency(e.target.value as typeof urgency)}
            className="w-full p-2 border rounded-md"
            disabled={isLoading}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className={`px-4 py-2 text-white rounded-md ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'Sending...' : 'Send Notification'}
        </button>
      </div>
    </div>
  )
}
