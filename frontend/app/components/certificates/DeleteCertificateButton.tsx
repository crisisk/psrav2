'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DeleteCertificateButtonProps {
  certificateId: string;
}

export function DeleteCertificateButton({
  certificateId,
}: DeleteCertificateButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/certificates/${certificateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete certificate');
      }

      router.refresh();
      setIsConfirmOpen(false);
    } catch (err) {
      console.error('Deletion error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete certificate');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsConfirmOpen(true)}
        className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
        disabled={isDeleting}
      >
        {isDeleting ? 'Deleting...' : 'Delete Certificate'}
      </button>

      {isConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
            <p className="mb-4 text-gray-600">
              Are you sure you want to delete this certificate? This action cannot be undone.
            </p>

            {error && (
              <p className="mb-4 text-red-600 text-sm">{error}</p>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md transition-colors disabled:opacity-50"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
