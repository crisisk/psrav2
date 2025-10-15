import { AuditLog } from '@/lib/types/audit-log'

export async function AuditLogs() {
  let auditLogs: AuditLog[] = []
  let error: string | null = null

  try {
    const response = await fetch('/api/audit-log', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error('Failed to fetch audit logs')
    }

    const data = await response.json()
    auditLogs = data
  } catch (err) {
    console.error('Error loading audit logs:', err)
    error = 'Failed to load audit logs. Please try again later.'
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        {error}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Timestamp
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              IP Address
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User Agent
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {auditLogs.map((log) => (
            <tr key={log.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {new Date(log.timestamp).toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {log.email}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {log.success ? 'Success' : 'Failed'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {log.ipAddress}
              </td>
              <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                {log.userAgent}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
