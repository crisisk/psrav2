'use client';

import { useState, useEffect } from 'react';
import { type AiSystem } from '@/lib/types/ai-system';

/**
 * Props for AiSystemsList component
 * @interface
 */
interface AiSystemsListProps {
  initialFilter?: 'pending' | 'approved' | 'rejected';
}

/**
 * Component to display and manage AI systems list
 * @param {AiSystemsListProps} props - Component properties
 */
export default function AiSystemsList({ initialFilter }: AiSystemsListProps) {
  const [systems, setSystems] = useState<AiSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState(initialFilter);

  useEffect(() => {
    const fetchSystems = async () => {
      try {
        setLoading(true);
        
        const query = statusFilter ? `?status=${statusFilter}` : '';
        const response = await fetch(`/api/ai-systems${query}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { data } = await response.json();
        setSystems(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch AI systems:', err);
        setError('Failed to load AI systems. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSystems();
  }, [statusFilter]);

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading AI systems...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-lg shadow-sm">
        <label className="flex items-center gap-2">
          <span className="text-sm font-medium">Filter by status:</span>
          <select
            value={statusFilter || ''}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
      </div>

      {/* Systems Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {systems.map((system) => (
          <div
            key={system.id}
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold mb-2">{system.name}</h3>
            <div className="space-y-2 text-sm">
              <p className="flex justify-between">
                <span className="text-gray-500">Provider:</span>
                <span className="font-medium">{system.provider}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-500">Risk Category:</span>
                <span className="font-medium">{system.riskLevel}</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    system.complianceStatus === 'compliant'
                      ? 'bg-green-100 text-green-800'
                      : system.complianceStatus === 'in-review'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {system.complianceStatus}
                </span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {systems.length === 0 && !loading && (
        <div className="p-6 text-center text-gray-500 bg-white rounded-lg">
          No AI systems found matching the current filters
        </div>
      )}
    </div>
  );
}
