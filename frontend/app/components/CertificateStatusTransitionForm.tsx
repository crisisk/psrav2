'use client';

import { useEffect, useState } from 'react';

enum CertificateStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
  RENEWED = 'RENEWED'
}

export default function CertificateStatusTransitionForm({
  certificateId
}: {
  certificateId: string
}) {
  const [currentStatus, setCurrentStatus] = useState<CertificateStatus>(CertificateStatus.DRAFT);
  const [selectedStatus, setSelectedStatus] = useState<CertificateStatus>(CertificateStatus.DRAFT);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch initial status (mock implementation)
  useEffect(() => {
    setCurrentStatus(CertificateStatus.ISSUED);
    setSelectedStatus(CertificateStatus.ISSUED);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch(`/api/certificates/${certificateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newStatus: selectedStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      setSuccess(true);
      // Refresh current status after successful update
      setCurrentStatus(selectedStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md p-6 bg-white rounded-lg shadow-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Status:
          </label>
          <input
            type="text"
            value={currentStatus}
            readOnly
            className="w-full p-2 border rounded-md bg-gray-100 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Status:
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as CertificateStatus)}
            className="w-full p-2 border rounded-md"
          >
            {Object.values(CertificateStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="p-3 text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 text-green-700 bg-green-100 rounded-md">
            Status updated successfully!
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Updating...' : 'Update Status'}
        </button>
      </form>
    </div>
  );
}
