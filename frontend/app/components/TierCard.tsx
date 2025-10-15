import { useState } from 'react';

interface Tier {
  id: string;
  title: string;
  description: string;
  price: string;
  features: string[];
}

interface TierCardProps {
  tier: Tier;
  isSelected?: boolean;
}

export default function TierCard({ tier, isSelected = false }: TierCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/tiers/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tierId: tier.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to select tier');
      }

      const data = await response.json();
      // Handle successful selection (e.g., state update, redirect, etc.)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to select tier');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`relative p-6 bg-white rounded-lg shadow-md border-2 ${
      isSelected ? 'border-blue-500' : 'border-gray-200'
    } transition-all duration-200 hover:shadow-lg`}>
      <div className="flex flex-col h-full">
        <h3 className="text-xl font-bold mb-2">{tier.title}</h3>
        <p className="text-3xl font-semibold mb-4">{tier.price}</p>
        <p className="text-gray-600 mb-4">{tier.description}</p>
        
        <div className="flex-grow mb-6">
          <ul className="space-y-2">
            {tier.features.map((feature) => (
              <li key={feature} className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={handleSelect}
          disabled={isLoading || isSelected}
          className={`w-full py-2 px-4 rounded-md font-medium ${
            isSelected
              ? 'bg-gray-300 cursor-not-allowed'
              : isLoading
              ? 'bg-blue-400 cursor-wait'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          } transition-colors duration-200`}
        >
          {isSelected ? 'Selected' : isLoading ? 'Processing...' : 'Select'}
        </button>

        {error && (
          <p className="mt-2 text-sm text-red-500">{error}</p>
        )}
      </div>
    </div>
  );
}
