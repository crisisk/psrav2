import { useEffect, useState } from 'react';
import { BarChart, TrendingUp } from 'lucide-react';
import { trackEvent } from '@/shared/lib/telemetry';

interface TrendData {
  date: string;
  pass: number;
  fail: number;
}

interface SavingsData {
  agreement: string;
  savings: number;
}

export const Trends = () => {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [savingsData, setSavingsData] = useState<SavingsData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendRes, savingsRes] = await Promise.all([
          fetch('/api/cfo/trend'),
          fetch('/api/cfo/savings-by-agreement')
        ]);
        
        const trendJson = await trendRes.json();
        const savingsJson = await savingsRes.json();
        
        setTrendData(trendJson);
        setSavingsData(savingsJson);
        
        trackEvent('trends_data_loaded');
      } catch (err) {
        console.error('Error fetching trends data:', err);
      }
    };

    fetchData();
  }, []);

  const maxSavings = Math.max(...savingsData.map(d => d.savings));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      {/* Pass/Fail Trend Chart */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center mb-4">
          <TrendingUp className="w-5 h-5 text-primary-600 mr-2" />
          <h3 className="font-semibold text-gray-900">Pass/Fail 7d Trend</h3>
        </div>
        
        <div className="flex h-64 items-end space-x-2">
          {trendData.map((day, i) => (
            <div 
              key={day.date}
              className="flex-1 flex flex-col"
              title={`${day.date}: Pass ${day.pass}, Fail ${day.fail}`}
            >
              <div 
                className="bg-red-500"
                style={{
                  height: `${(day.fail / (day.pass + day.fail)) * 100}%`
                }}
              />
              <div
                className="bg-green-500"
                style={{
                  height: `${(day.pass / (day.pass + day.fail)) * 100}%`
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Savings by Agreement Chart */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="flex items-center mb-4">
          <BarChart className="w-5 h-5 text-primary-600 mr-2" />
          <h3 className="font-semibold text-gray-900">Savings by Agreement</h3>
        </div>

        <div className="space-y-3">
          {savingsData.map(item => (
            <div key={item.agreement} className="space-y-1">
              <div className="text-sm text-gray-600">{item.agreement}</div>
              <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full"
                  style={{
                    width: `${(item.savings / maxSavings) * 100}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
