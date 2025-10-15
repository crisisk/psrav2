import Link from 'next/link';

interface AuditLogEntry {
  id: string;
  customerId: string;
  customerName: string;
  action: string;
  timestamp: string;
}

interface AuditLogTableProps {
  initialData?: {
    data: AuditLogEntry[];
    total: number;
    page: number;
    pageSize: number;
  };
}

export async function AuditLogTable({ initialData }: AuditLogTableProps) {
  let auditLogs = initialData?.data || [];
  
  if (!initialData) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/audit-logs`,
        { next: { revalidate: 60 } }
      );
      
      if (!res.ok) throw new Error('Failed to fetch audit logs');
      
      const data = await res.json();
      auditLogs = data.data;
    } catch (error) {
      console.error('Audit log fetch error:', error);
      return (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg">
          Error loading audit logs. Please refresh the page.
        </div>
      );
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {auditLogs.map((entry) => (
            <tr key={entry.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <Link
                  href={`/customers/${entry.customerId}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                  prefetch={false}
                >
                  {entry.customerName}
                </Link>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{entry.action}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {new Date(entry.timestamp).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
