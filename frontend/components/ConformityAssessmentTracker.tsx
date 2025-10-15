'use client'
import { useState, useEffect } from 'react'
import { z } from 'zod'

type Assessment = {
  id: string
  name: string
  status: 'Pending' | 'InProgress' | 'Completed'
  createdAt: Date
}

type StatusBadgeProps = {
  status: Assessment['status']
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
  const statusColors = {
    Pending: 'bg-yellow-100 text-yellow-800',
    InProgress: 'bg-blue-100 text-blue-800',
    Completed: 'bg-green-100 text-green-800'
  }

  return (
    <span className={`px-3 py-1 rounded-full text-sm ${statusColors[status]}`}>
      {status}
    </span>
  )
}

export default function ConformityAssessmentTracker() {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [name, setName] = useState('')
  const [status, setStatus] = useState<Assessment['status']>('Pending')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        const response = await fetch('/api/conformity-assessments')
        const data = await response.json()
        if (response.ok) {
          setAssessments(data)
        } else {
          setError('Failed to load assessments')
        }
      } catch (err) {
        setError('Network error occurred')
      }
    }

    fetchAssessments()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/conformity-assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, status })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create assessment')
      }

      setAssessments([data, ...assessments])
      setName('')
      setStatus('Pending')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Conformity Assessment Tracker</h1>

      <form onSubmit={handleSubmit} className="mb-8 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Assessment Name
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
                required
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Assessment['status'])}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2"
              >
                <option value="Pending">Pending</option>
                <option value="InProgress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </label>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSubmitting ? 'Submitting...' : 'Add Assessment'}
        </button>
      </form>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium">Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-6 py-3 text-left text-sm font-medium">Created At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {assessments.map((assessment) => (
              <tr key={assessment.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">{assessment.name}</td>
                <td className="px-6 py-4 text-sm">
                  <StatusBadge status={assessment.status} />
                </td>
                <td className="px-6 py-4 text-sm">
                  {new Date(assessment.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
