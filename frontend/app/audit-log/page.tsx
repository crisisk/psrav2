import { SearchBar } from '@/components/SearchBar';

interface AuditLogPageProps {
  searchParams: {
    q?: string;
  };
}

export default async function AuditLogPage({ searchParams }: AuditLogPageProps) {
  const searchQuery = searchParams.q || '';
  let auditLogs = [];
  
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/audit-logs?query=${encodeURIComponent(searchQuery)}`
    );
    
    if (!response.ok) throw new Error('Failed to fetch audit logs');
    
    const { results } = await response.json();
    auditLogs = results;
  } catch (error) {
    console.error('Error loading audit logs:', error);
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Audit Log Viewer</h1>
      <div className="mb-6">
        <SearchBar initialValue={searchQuery} />
      </div>
      
      <div className="space-y-2">
        {auditLogs.length === 0 ? (
          <p className="text-gray-500">No audit logs found</p>
        ) : (
          auditLogs.map((log: any) => (
            <div
              key={log.id}
              className="p-4 bg-white rounded-lg shadow-sm border"
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{log.action}</span>
                <span className="text-sm text-gray-500">{log.timestamp}</span>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                User: {log.user}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
