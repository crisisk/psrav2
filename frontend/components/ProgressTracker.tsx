'use client';

import useSWR from 'swr';
import { useEffect } from 'react';

interface ProgressData {
  analyzedPages: number;
  totalPages: number;
}

export default function ProgressTracker() {
  const fetcher = (url: string) => fetch(url).then(res => res.json());
  const { data, error, isLoading } = useSWR<ProgressData>('/api/progress', fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true,
  });

  if (isLoading) return <div className="p-4 text-gray-600">Loading progress...</div>;
  if (error) return <div className="p-4 text-red-500">Failed to load progress data</div>;

  const percentage = ((data?.analyzedPages || 0) / (data?.totalPages || 1)) * 100;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Conformity Assessment Progress</h2>
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{data?.analyzedPages || 0} pages analyzed</span>
          <span>{data?.totalPages || 0} total pages</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-blue-500 rounded-full h-4 transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <div className="text-center">
        <span className="text-2xl font-bold text-blue-600">
          {percentage.toFixed(1)}%
        </span>
        <p className="text-sm text-gray-500 mt-1">Completion Progress</p>
      </div>
    </div>
  );
}
