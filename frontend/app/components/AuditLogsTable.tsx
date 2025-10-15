'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { AuditLog } from '@/lib/services/auditLogService';

interface Props {
  logs: AuditLog[];
  currentPage: number;
  totalPages: number;
}

export function AuditLogsTable({ logs, currentPage, totalPages }: Props) {
  const searchParams = useSearchParams();
  const newParams = new URLSearchParams(searchParams.toString());

  return (
    <div className="rounded-lg border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.action}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.userId}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
        <span className="text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </span>
        <div className="space-x-4">
          {currentPage > 1 && (
            <Link
              href={`?${new URLSearchParams({
                ...Object.fromEntries(newParams),
                page: (currentPage - 1).toString(),
              })}`}
              className="px-3 py-1 text-sm text-gray-700 bg-white border rounded-md hover:bg-gray-100"
            >
              Previous
            </Link>
          )}
          {currentPage < totalPages && (
            <Link
              href={`?${new URLSearchParams({
                ...Object.fromEntries(newParams),
                page: (currentPage + 1).toString(),
              })}`}
              className="px-3 py-1 text-sm text-gray-700 bg-white border rounded-md hover:bg-gray-100"
            >
              Next
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
