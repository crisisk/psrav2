import { AuditLogsTable } from '@/components/AuditLogsTable';

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const page = searchParams?.page ? Number(searchParams.page) : 1;
  const pageSize = searchParams?.pageSize ? Number(searchParams.pageSize) : 10;

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/audit-logs?page=${page}&pageSize=${pageSize}`,
    { cache: 'no-store' }
  );

  if (!response.ok) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h2 className="text-red-600 font-medium">Error loading audit logs</h2>
        <p className="text-red-500 text-sm mt-2">
          Please try again or contact support
        </p>
      </div>
    );
  }

  const { data, pagination } = await response.json();

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
        <h3 className="text-blue-800 font-medium">Analysis Progress</h3>
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 rounded-full h-2"
              style={{ width: '8.3%' }}
            />
          </div>
          <p className="mt-2 text-sm text-gray-600">
            20/240 pages analyzed (8.3%)
          </p>
        </div>
      </div>

      <AuditLogsTable
        logs={data}
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
      />
    </div>
  );
}
