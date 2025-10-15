import { type Certificate } from '@/lib/types'

interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  pagination?: {
    page: number
    total: number
    totalPages: number
  }
}

export async function CertificateList() {
  let data: ApiResponse<Certificate[]> | null = null

  try {
    const response = await fetch('/api/certificates', {
      next: { tags: ['certificates'] }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch certificates')
    }

    data = await response.json()

  } catch (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <p className="text-red-600">
          Error loading certificates: {(error as Error).message}
        </p>
      </div>
    )
  }

  if (!data?.data?.length) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-blue-600">No certificates found</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Common Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Issuer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Valid To
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.data.map((cert) => (
            <tr key={cert.id}>
              <td className="px-6 py-4 whitespace-nowrap">{cert.commonName}</td>
              <td className="px-6 py-4 whitespace-nowrap">{cert.issuer}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {new Date(cert.validTo).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {data.pagination && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-700">
              Page {data.pagination.page} of {data.pagination.totalPages}
            </span>
            <div className="space-x-2">
              <button
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded disabled:opacity-50"
                disabled={data.pagination.page === 1}
              >
                Previous
              </button>
              <button
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded disabled:opacity-50"
                disabled={data.pagination.page === data.pagination.totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
