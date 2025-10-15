'use client';

import { useEffect, useState } from 'react';

interface RevenueData {
  month: string;
  revenue: number;
}

export function RevenueChartIcon() {
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/revenue');
        if (!response.ok) {
          throw new Error('Failed to fetch revenue data');
        }
        const { data } = await response.json();
        setData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="w-12 h-12 bg-gray-200 rounded animate-pulse" />
    );
  }

  if (error) {
    return (
      <div className="w-12 h-12 flex items-center justify-center bg-red-50 text-red-600 rounded">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
    );
  }

  // Normalize data for SVG rendering
  const revenues = data.map((d) => d.revenue);
  const maxRevenue = Math.max(...revenues);
  const minRevenue = Math.min(...revenues);
  const range = maxRevenue - minRevenue || 1;

  const points = revenues
    .map((revenue, index) => {
      const x = (index / (revenues.length - 1)) * 100;
      const y = ((maxRevenue - revenue) / range) * 40 + 5;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="w-12 h-12 p-2 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors">
      <svg
        viewBox="0 0 100 50"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          points={points}
        />
      </svg>
    </div>
  );
}
