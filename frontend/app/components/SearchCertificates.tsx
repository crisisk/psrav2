'use client'

import { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/useDebounce'

interface Certificate {
  id: string
  title: string
  content: string
  issued_to: string
  issued_at: string
  content_highlight: string
}

interface ApiResponse {
  status: 'success' | 'error'
  message?: string
  data?: Certificate[]
}

export function SearchCertificates() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Certificate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debouncedQuery = useDebounce(query, 500)

  useEffect(() => {
    const searchCertificates = async () => {
      if (!debouncedQuery.trim()) {
        setResults([])
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/certificates/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: debouncedQuery })
        })

        const data: ApiResponse = await response.json()

        if (!response.ok) {
          throw new Error(data.message || 'Failed to search certificates')
        }

        setResults(data.data || [])
      } catch (err) {
        console.error('Search error:', err)
        setError(err instanceof Error ? err.message : 'Failed to search')
      } finally {
        setIsLoading(false)
      }
    }

    searchCertificates()
  }, [debouncedQuery])

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search certificates..."
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          aria-label="Search certificates"
        />
        
        {isLoading && (
          <div className="absolute right-3 top-3">
            <svg className="animate-spin h-6 w-6 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 text-red-600 bg-red-50 rounded-lg">
          Error: {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Title</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Issued To</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {results.map((certificate) => (
                <tr key={certificate.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">
                    <div className="font-medium text-gray-900">{certificate.title}</div>
                    <div 
                      className="text-gray-500 mt-1"
                      dangerouslySetInnerHTML={{ __html: certificate.content_highlight }}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{certificate.issued_to}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(certificate.issued_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && !error && debouncedQuery && results.length === 0 && (
        <div className="p-3 text-gray-500 text-center">
          No certificates found matching your search
        </div>
      )}
    </div>
  )
}
