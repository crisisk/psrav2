'use client';

import { useState } from 'react';

type SendToPartnerProps = {
  auditLogIds: string[];
};

export const SendToPartner = ({ auditLogIds }: SendToPartnerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!selectedPartner || auditLogIds.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/audit-logs/send-to-partner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partnerId: selectedPartner,
          auditLogIds: auditLogIds
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send audit logs');
      }

      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Send to partner failed:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
        disabled={auditLogIds.length === 0}
      >
        Send to Partner
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Send to Partner</h2>

            <div className="space-y-4">
              <select
                value={selectedPartner}
                onChange={(e) => setSelectedPartner(e.target.value)}
                className="w-full p-2 border rounded-lg"
                disabled={isLoading}
              >
                <option value="">Select a partner</option>
                <option value="3fa85f64-5717-4562-b3fc-2c963f66afa6">Partner A</option>
                <option value="4eb85f64-5717-4562-b3fc-2c963f66afa7">Partner B</option>
              </select>

              {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-100 text-green-700 rounded-lg">
                  Audit logs sent successfully!
                </div>
              )}

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
                  disabled={!selectedPartner || isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};