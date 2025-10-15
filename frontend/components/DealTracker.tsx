'use client';

import { useEffect, useState } from 'react';
import { DealStage } from '@/types';

type Deal = {
  id: string;
  name: string;
  stage: DealStage;
  amount: number;
  contact: string;
  createdAt: string;
  updatedAt: string;
};

export default function DealTracker() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const response = await fetch('/api/deals');
        if (!response.ok) throw new Error('Failed to fetch');
        const { data } = await response.json();
        setDeals(data);
      } catch (err) {
        setError('Failed to load deals');
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  const handleStageChange = async (dealId: string, newStage: DealStage) => {
    try {
      const response = await fetch(`/api/deals`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: dealId, stage: newStage }),
      });

      if (!response.ok) throw new Error('Update failed');

      const updatedDeal = await response.json();
      setDeals(deals.map(deal =>
        deal.id === dealId ? updatedDeal.data : deal
      ));
    } catch (err) {
      setError('Failed to update deal stage');
    }
  };

  const stageColors: Record<DealStage, string> = {
    [DealStage.NEW]: 'bg-blue-100 text-blue-800',
    [DealStage.CONTACTED]: 'bg-purple-100 text-purple-800',
    [DealStage.QUALIFIED]: 'bg-green-100 text-green-800',
    [DealStage.PROPOSAL]: 'bg-yellow-100 text-yellow-800',
    [DealStage.NEGOTIATION]: 'bg-orange-100 text-orange-800',
    [DealStage.WON]: 'bg-emerald-100 text-emerald-800',
    [DealStage.LOST]: 'bg-red-100 text-red-800'
  };

  if (loading) return <div className='p-4'>Loading...</div>;
  if (error) return <div className='p-4 text-red-500'>{error}</div>;

  return (
    <div className='p-4 space-y-4'>
      <h1 className='text-2xl font-bold'>Conformity Assessment Tracker</h1>
      
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
        {deals.map(deal => (
          <div key={deal.id} className='p-4 border rounded-lg shadow-sm bg-white'>
            <h2 className='text-lg font-semibold'>{deal.name}</h2>
            <p className='text-gray-600'>{deal.contact}</p>
            <p className='font-medium mt-2'>€{deal.amount.toLocaleString()}</p>
            
            <div className='mt-4 space-y-2'>
              <span className={`px-2 py-1 rounded text-sm ${stageColors[deal.stage]}`}>
                {deal.stage}
              </span>
              
              <div className='grid grid-cols-2 gap-2'>
                {Object.values(DealStage).map(stage => (
                  <button
                    key={stage}
                    onClick={() => handleStageChange(deal.id, stage)}
                    className={`text-xs p-2 rounded ${deal.stage === stage 
                      ? 'bg-gray-200 cursor-default'
                      : 'bg-gray-50 hover:bg-gray-100'}`}
                    disabled={deal.stage === stage}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
