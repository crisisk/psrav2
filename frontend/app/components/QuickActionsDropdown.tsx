'use client';

import { useState } from 'react';

export default function QuickActionsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available quick actions configuration
  const actions = [
    { id: 'export-pdf', label: 'Export as PDF' },
    { id: 'send-reminders', label: 'Send Reminders' },
    { id: 'generate-report', label: 'Generate Monthly Report' },
    { id: 'request-review', label: 'Request Manager Review' },
  ] as const;

  const handleAction = async (actionId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/quick-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionId }),
      });

      if (!response.ok) {
        throw new Error(`Action failed: ${response.statusText}`);
      }

      const data = await response.json();
      alert(`Success: ${data.message}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform action');
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block text-left">
      {/* Dropdown trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        {loading ? 'Processing...' : 'Quick Actions'}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {actions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleAction(action.id)}
                className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 text-left disabled:opacity-50"
                disabled={loading}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mt-2 text-sm text-red-600 animate-pulse">
          Error: {error}
        </div>
      )}
    </div>
  );
}
