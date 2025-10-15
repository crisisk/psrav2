'use client';

import { useState } from 'react';

export default function NotificationStatus() {
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testNotification = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/deals/123/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: 'Qualified' })
      });

      const data = await response.json();
      setStatus(response.ok ? data.message : data.error);
    } catch (error) {
      setStatus('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 max-w-md">
      <button
        onClick={testNotification}
        disabled={loading}
        className={`px-4 py-2 rounded ${loading
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
      >
        {loading ? 'Sending...' : 'Test Notification'}
      </button>
      {status && (
        <p className={`mt-2 text-sm ${status.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>
          {status}
        </p>
      )}
    </div>
  );
}
