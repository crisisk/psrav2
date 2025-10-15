'use client'

import { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-hot-toast'

interface EditorProps {
  systemId: string
  sectionId: string
  initialContent: string
  userId: string
}

export function DocumentationSectionEditor({
  systemId,
  sectionId,
  initialContent,
  userId
}: EditorProps) {
  const [content, setContent] = useState(initialContent)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await axios.put(
        `/api/documentation/${systemId}/${sectionId}`,
        { content, userId }
      )

      if (response.status === 200) {
        toast.success('Documentation updated successfully')
      }
    } catch (err: any) {
      console.error('Update failed:', err)
      setError(
        err.response?.data?.error || 'Failed to update documentation section'
      )
      toast.error('Update failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={10}
          disabled={isSubmitting}
        />

        {error && (
          <div className="p-2 text-red-600 bg-red-100 rounded-md">{error}</div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-4 py-2 text-white rounded-md ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
