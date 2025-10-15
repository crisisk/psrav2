'use client';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useEffect, useState } from 'react';

type HistoricalData = {
  timestamp: string;
  complianceLevel: number;
  assessmentsCount: number;
};

type ChartProps = {
  startDate: string;
  endDate: string;
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function HistoricalTrends({ startDate, endDate }: ChartProps) {
  const [chartData, setChartData] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `/api/historical?startDate=${startDate}&endDate=${endDate}`
        );
        if (!response.ok) throw new Error('Failed to fetch');
        const { data } = await response.json();
        setChartData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  if (loading) return <div className="p-4 text-gray-600">Loading trends...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  const data = {
    labels: chartData.map(item =>
      new Date(item.timestamp).toLocaleDateString('nl-NL')
    ),
    datasets: [
      {
        label: 'Compliance Level (%)',
        data: chartData.map(item => item.complianceLevel),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.4,
      },
      {
        label: 'Assessments Count',
        data: chartData.map(item => item.assessmentsCount),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Historical Trends</h2>
      <div className="h-96">
        <Line
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'top' },
              tooltip: { mode: 'index', intersect: false },
            },
            scales: {
              x: { title: { display: true, text: 'Date' } },
              y: { title: { display: true, text: 'Value' } },
            },
          }}
        />
      </div>
    </div>
  );
}
