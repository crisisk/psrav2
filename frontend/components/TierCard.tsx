'use client';

import { useState } from 'react';

type TierCardProps = {
  tierId: string;
  userId: string;
  title: string;
  description: string;
  price: string;
  features: string[];
};

export function TierCard({
  tierId,
  userId,
  title,
  description,
  price,
  features
}: TierCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelection = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/selection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, tierId }),
      });

      if (!response.ok) {
        throw new Error('Selection failed');
      }

      const data = await response.json();
      console.log('Selection successful:', data);
    } catch (err) {
      console.error('Selection error:', err);
      setError('Failed to select tier. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-6 bg-white shadow-lg transition-transform hover:scale-105">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <p className="text-gray-600 mb-4">{description}</p>
      <div className="text-3xl font-bold mb-6">{price}</div>
      
      <ul className="mb-8 space-y-2">
        {features.map((feature) => (
          <li key={feature} className="flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-green-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      <button
        onClick={handleSelection}
        disabled={isLoading}
        className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors
          ${isLoading 
            ? 'bg-blue-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {isLoading ? 'Processing...' : 'Select'}
      </button>

      {error && (
        <p className="mt-4 text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
}
