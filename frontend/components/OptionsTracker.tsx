'use client'
import { useEffect, useState } from 'react'
import { Option } from '@/types/index'

export default function OptionsTracker() {
  const [options, setOptions] = useState<Option[]>([])
  const [formState, setFormState] = useState<Partial<Option>>({
    key: '',
    value: '',
    type: 'user',
  })
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchOptions()
  }, [])

  const fetchOptions = async () => {
    try {
      const response = await fetch('/api/options')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setOptions(data)
    } catch (err) {
      setError('Failed to load options')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const method = formState.id ? 'PUT' : 'POST'
    const url = formState.id ? `/api/options` : '/api/options'

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Request failed')
      }

      await fetchOptions()
      setFormState({ key: '', value: '', type: 'user' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch('/api/options', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) throw new Error('Delete failed')
      await fetchOptions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Conformity Assessment Options</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-8 p-4 bg-white shadow-md rounded">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Key
              <input
                type="text"
                value={formState.key}
                onChange={(e) => setFormState({ ...formState, key: e.target.value })}
                className="w-full p-2 border rounded mt-1"
                required
              />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Type
              <select
                value={formState.type}
                onChange={(e) => setFormState({ ...formState, type: e.target.value as 'system' | 'user' })}
                className="w-full p-2 border rounded mt-1"
              >
                <option value="system">System</option>
                <option value="user">User</option>
              </select>
            </label>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Value
            <textarea
              value={formState.value}
              onChange={(e) => setFormState({ ...formState, value: e.target.value })}
              className="w-full p-2 border rounded mt-1 h-24"
            />
          </label>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {formState.id ? 'Update Option' : 'Add Option'}
        </button>
      </form>

      <div className="bg-white shadow overflow-hidden rounded">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {options.map((option) => (
              <tr key={option.id}>
                <td className="px-6 py-4 whitespace-nowrap">{option.key}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      option.type === 'user'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {option.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{option.value}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => setFormState(option)}
                    className="text-indigo-600 hover:text-indigo-900 mr-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(option.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
