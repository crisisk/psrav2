'use client';

import { useEffect, useState } from 'react';
import { AuditLog } from '@/lib/services/auditLogService';

export function AuditLogSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (!searchTerm.trim()) {
        setResults([]);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/audit-logs/search?query=${encodeURIComponent(searchTerm)}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch results');
        }

        const data = await response.json();
        setResults(data.results);
      } catch (err) {
        console.error('Search failed:', err);
        setError('Failed to load search results');
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Search audit logs..."
        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {isLoading && (
        <div className="text-gray-500 text-center py-4">Loading...</div>
      )}

      {error && (
        <div className="text-red-500 text-center py-4">{error}</div>
      )}

      {!isLoading && !error && results.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">Certificate #</th>
                <th className="px-4 py-2 text-left">Product</th>
                <th className="px-4 py-2 text-left">Supplier</th>
                <th className="px-4 py-2 text-left">Origin</th>
                <th className="px-4 py-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {results.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{log.certificate_number}</td>
                  <td className="px-4 py-2">{log.product_name}</td>
                  <td className="px-4 py-2">{log.supplier_name}</td>
                  <td className="px-4 py-2">{log.origin_country}</td>
                  <td className="px-4 py-2">
                    {log.timestamp ? new Date(log.timestamp).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
