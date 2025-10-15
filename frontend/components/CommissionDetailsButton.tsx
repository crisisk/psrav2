'use client';

import { useState } from 'react';
import { FiInfo } from 'react-icons/fi';

type Commission = {
  id: string;
  amount: number;
  client: string;
  date: string;
  description: string;
};

export default function CommissionDetailsButton({
  commissionId,
}: {
  commissionId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<Commission | null>(null);

  const fetchDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/commissions/${commissionId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch details');
      }

      const data: Commission = await response.json();
      setDetails(data);
      setIsOpen(true);
    } catch (err) {
      console.error('Failed to load commission details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load details');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={fetchDetails}
        disabled={isLoading}
        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
          ${isLoading
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
      >
        {isLoading ? 'Loading...' : 'View Details'}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Commission Details</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {error ? (
              <div className="text-red-600 p-4 bg-red-50 rounded-md flex items-center gap-2">
                <FiInfo className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            ) : details ? (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Client:</span>
                  <span className="font-medium">{details.client}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">
                    ${details.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">
                    {new Date(details.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-gray-600 mb-2">Description:</p>
                  <p className="text-gray-800">{details.description}</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
