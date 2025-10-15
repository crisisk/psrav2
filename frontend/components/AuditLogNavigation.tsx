import Link from 'next/link';

export function AuditLogNavigation() {
  return (
    <div className="mb-8 flex justify-between items-center">
      <h1 className="text-2xl font-bold">Audit Log Viewer</h1>
      <Link
        href="/certificates/create"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
      >
        Create New Certificate
      </Link>
    </div>
  );
}
