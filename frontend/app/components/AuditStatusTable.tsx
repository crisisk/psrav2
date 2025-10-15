import { AuditLogStatus } from '@/app/api/audit-logs/status/route';

export async function AuditStatusTable() {
  let statuses: AuditLogStatus[] = [];
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/audit-logs/status`, {
      next: { revalidate: 60 } // Revalidate every 60 seconds
    });

    if (!response.ok) {
      throw new Error('Failed to fetch audit log statuses');
    }

    statuses = await response.json();
  } catch (error) {
    console.error('Error loading audit status:', error);
    return (
      <div className="text-red-500 p-4 bg-red-50 rounded-lg">
        Error loading audit log statuses. Please try again later.
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Timestamp
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Message
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {statuses.map((status) => (
            <tr key={status.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`${getStatusColor(status.status)} px-2 py-1 rounded-full text-sm`}
                >
                  {status.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(status.timestamp).toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {status.message || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
