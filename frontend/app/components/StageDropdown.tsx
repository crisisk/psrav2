'use client';

import { useEffect, useState } from 'react';

interface StageResponse {
  stages?: string[];
  error?: string;
}

export default function StageDropdown() {
  const [stages, setStages] = useState<string[]>([]);
  const [selectedStage, setSelectedStage] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchStages = async () => {
      try {
        const response = await fetch('/api/stages');
        if (!response.ok) throw new Error('Failed to fetch');

        const data: StageResponse = await response.json();
        if (data.error) throw new Error(data.error);

        setStages(data.stages || []);
        setError('');
      } catch (err) {
        setError('Failed to load stages');
        setStages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStages();
  }, []);

  if (loading) {
    return (
      <div className="p-2 text-gray-500 animate-pulse">
        Loading stages...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-2 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="relative w-48">
      <select
        value={selectedStage}
        onChange={(e) => setSelectedStage(e.target.value)}
        className="w-full p-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
      >
        {stages.map((stage) => (
          <option key={stage} value={stage}>
            {stage}
          </option>
        ))}
      </select>
    </div>
  );
}
