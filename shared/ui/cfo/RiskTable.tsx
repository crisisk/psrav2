import { useState, useEffect } from 'react';
import { ArrowUpDown } from 'lucide-react';
import { trackEvent } from '@/shared/lib/telemetry';

interface RiskEntry {
  product: string;
  risk: 'HIGH' | 'MEDIUM' | 'LOW';
  value: number;
  reason: string;
}

const getRiskColor = (risk: RiskEntry['risk']) => {
  switch (risk) {
    case 'HIGH':
      return 'bg-red-100 text-red-800';
    case 'MEDIUM':
      return 'bg-yellow-100 text-yellow-800';
    case 'LOW':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const RiskTable = () => {
  const [data, setData] = useState<RiskEntry[]>([]);
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/cfo/at-risk');
        const json = await response.json();
        setData(json);
      } catch (error) {
        console.error('Failed to fetch risk data:', error);
      }
    };

    fetchData();
  }, []);

  const handleSort = () => {
    const newSort = !sortDesc;
    setSortDesc(newSort);
    setData([...data].sort((a, b) =>
      newSort ? b.value - a.value : a.value - b.value
    ));
    trackEvent('dashboard_action', { action: 'risk_table_sort' });
  };

  return (
    <div className="bg-white dark:bg-dark-bg-surface rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">At Risk Products</h2>

      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No at-risk products found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Product</th>
                <th className="text-left p-2">Risk Level</th>
                <th className="text-left p-2 cursor-pointer" onClick={handleSort}>
                  <div className="flex items-center">
                    Value <ArrowUpDown className="ml-1 h-4 w-4" />
                  </div>
                </th>
                <th className="text-left p-2">Reason</th>
              </tr>
            </thead>
            <tbody>
              {data.map((entry, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-2">{entry.product}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(entry.risk)}`}>
                      {entry.risk}
                    </span>
                  </td>
                  <td className="p-2">€{entry.value.toLocaleString()}</td>
                  <td className="p-2 text-sm text-gray-600">{entry.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
