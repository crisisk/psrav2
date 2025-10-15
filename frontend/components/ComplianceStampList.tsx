'use client';

import { useEffect, useState } from 'react';
import { ComplianceStamp } from '@/types/index';

interface ComplianceStampListProps {
  onSelect?: (stamp: ComplianceStamp) => void;
}

export function ComplianceStampList({ onSelect }: ComplianceStampListProps) {
  const [stamps, setStamps] = useState<ComplianceStamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStamps = async () => {
      try {
        const response = await fetch('/api/compliance-stamps');
        if (!response.ok) throw new Error('Failed to fetch stamps');
        const data = await response.json();
        setStamps(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stamps');
      } finally {
        setLoading(false);
      }
    };

    fetchStamps();
  }, []);

  if (loading) return <div className='p-4 text-gray-500'>Loading stamps...</div>;
  if (error) return <div className='p-4 text-red-500'>{error}</div>;

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4'>
      {stamps.map((stamp) => (
        <div
          key={stamp.id}
          className='border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer'
          onClick={() => onSelect?.(stamp)}
        >
          <div
            className='w-8 h-8 rounded-full mb-2'
            style={{ backgroundColor: stamp.color }}
          />
          <h3 className='font-semibold text-lg'>{stamp.name}</h3>
          <p className='text-gray-600 text-sm'>{stamp.description}</p>
          <div className='mt-2 text-xs text-gray-400'>
            Created: {new Date(stamp.createdAt).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
}
