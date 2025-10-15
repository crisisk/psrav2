'use client';

import { useState, useEffect } from 'react';
import type { Action } from '@/app/api/actions/route';

interface ActionsTableProps {
  initialActions: Action[];
}

export default function ActionsTable({ initialActions }: ActionsTableProps) {
  const [actions, setActions] = useState<Action[]>(initialActions);
  const [loading, setLoading] = useState(false);

  // Fetch actions from API
  const refreshActions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/actions');
      const data = await response.json();
      setActions(data);
    } catch (error) {
      console.error('Failed to fetch actions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshActions();
  }, []);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    'in-progress': 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Regulation Reference</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {actions.map((action) => (
            <tr key={action.id}>
              <td className="px-6 py-4 whitespace-nowrap">{action.title}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[action.status]}`}
                >
                  {action.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">{new Date(action.dueDate).toLocaleDateString()}</td>
              <td className="px-6 py-4 whitespace-nowrap">{action.assignedTo || '-'}</td>
              <td className="px-6 py-4 whitespace-nowrap">{action.regulationReference || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {loading && (
        <div className="p-4 text-center text-gray-500">
          Loading actions...
        </div>
      )}
      {!loading && actions.length === 0 && (
        <div className="p-4 text-center text-gray-500">
          No actions found
        </div>
      )}
    </div>
  );
}
