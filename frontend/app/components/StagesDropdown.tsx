'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * StagesDropdown component for filtering by assessment stage
 * @returns JSX.Element - Dropdown component with stage options
 */
export default function StagesDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [stages, setStages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch stages from API on component mount
  useEffect(() => {
    const fetchStages = async () => {
      try {
        const response = await fetch('/api/stages');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setStages(data.stages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stages');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStages();
  }, []);

  // Handle stage selection change
  const handleStageChange = (stage: string) => {
    const newParams = new URLSearchParams(searchParams.toString());

    if (stage === 'all') {
      newParams.delete('stage');
    } else {
      newParams.set('stage', stage);
    }

    router.push(`?${newParams.toString()}`, { scroll: false });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse p-2 rounded-md bg-gray-100 w-48">
        Loading stages...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2 text-red-600 bg-red-50 rounded-md">
        Error: {error}
      </div>
    );
  }

  return (
    <select
      aria-label="Filter by assessment stage"
      defaultValue={searchParams.get('stage') || 'all'}
      onChange={(e) => handleStageChange(e.target.value)}
      className="w-48 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
    >
      <option value="all">Stage: All</option>
      {stages
        .filter(stage => stage !== 'all')
        .map((stage) => (
          <option key={stage} value={stage}>
            {stage}
          </option>
        ))}
    </select>
  );
}
