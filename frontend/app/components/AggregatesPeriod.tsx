import { AggregatesResponse } from '@/app/api/aggregates/route';

type Props = {
  period: 'week' | 'month' | 'quarter' | 'year';
};

export default async function AggregatesPeriod({ period }: Props) {
  let data: AggregatesResponse['data'] | null = null;
  let error: string | null = null;

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/aggregates?period=${period}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: AggregatesResponse = await response.json();
    
    if (result.status !== 200 || !result.data) {
      throw new Error(result.message || 'Failed to fetch aggregates');
    }

    data = result.data;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load data';
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h2 className="text-lg font-semibold mb-4">{data.period} Summary</h2>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="border-r pr-4">
          <p className="text-sm text-gray-500">Total Assessments</p>
          <p className="text-2xl font-bold">{data.totalAssessments}</p>
        </div>
        
        <div className="border-r pr-4">
          <p className="text-sm text-gray-500">Average Score</p>
          <p className="text-2xl font-bold">{data.averageScore}%</p>
        </div>
        
        <div>
          <p className="text-sm text-gray-500">Trend</p>
          <p className={`text-2xl font-bold ${
            data.trend > 0 ? 'text-green-600' : 
            data.trend < 0 ? 'text-red-600' : 'text-gray-600'
          }`}>
            {data.trend > 0 ? '+' : ''}{data.trend}%
          </p>
        </div>
      </div>
    </div>
  );
}
