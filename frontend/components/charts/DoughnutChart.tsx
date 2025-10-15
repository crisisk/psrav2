import React, { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
  Plugin,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// --- Types ---

/**
 * Defines the structure for a single data segment in the doughnut chart.
 */
export interface DoughnutChartSegment {
  label: string;
  value: number;
  color: string;
}

/**
 * Defines the props for the DoughnutChart component.
 */
export interface DoughnutChartProps {
  /** The title to display above the chart. */
  title: string;
  /** The data segments for the chart. */
  data: DoughnutChartSegment[];
  /** The size of the chart container (e.g., 'w-full h-64'). */
  className?: string;
}

// --- Constants ---

const SEVENSA_COLORS = {
  PRIMARY: '#00A896', // Sevensa primary
  SECONDARY: '#2D3A45', // Sevensa secondary/dark
  LIGHT_GRAY: '#E5E7EB', // Tailwind gray-200 for background/remainder
};

// --- Custom Plugin for Center Text (Percentage Label) ---

const centerTextPlugin: Plugin<'doughnut'> = {
  id: 'centerText',
  beforeDraw: (chart) => {
    const { ctx, chartArea: { top, bottom, left, right, width, height }, config } = chart;
    const total = config.data.datasets[0].data.reduce((sum: number, val: number) => sum + val, 0);
    
    // Find the largest value and its label
    const data = config.data.datasets[0].data as number[];
    const labels = config.data.labels as string[];
    
    if (data.length === 0) return;

    let largestValue = 0;
    let largestIndex = -1;
    data.forEach((value, index) => {
      if (value > largestValue) {
        largestValue = value;
        largestIndex = index;
      }
    });

    if (largestIndex === -1) return;

    const percentage = total > 0 ? ((largestValue / total) * 100).toFixed(0) : '0';
    const label = labels[largestIndex];

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const centerX = (left + right) / 2;
    const centerY = (top + bottom) / 2;

    // 1. Percentage Text
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = SEVENSA_COLORS.SECONDARY;
    ctx.fillText(`${percentage}%`, centerX, centerY - 10);

    // 2. Label Text
    ctx.font = '14px sans-serif';
    ctx.fillStyle = SEVENSA_COLORS.SECONDARY;
    ctx.fillText(label, centerX, centerY + 15);

    ctx.restore();
  },
};

// --- Component ---

/**
 * A production-ready Doughnut Chart component using Chart.js and Tailwind CSS.
 * It displays data segments, a legend, interactive tooltips, and the percentage
 * of the largest segment in the center.
 */
const DoughnutChart: React.FC<DoughnutChartProps> = ({ title, data, className = 'w-full h-80' }) => {
  const chartData: ChartData<'doughnut'> = useMemo(() => {
    // Ensure all segments have a value and a color
    const validData = data.filter(d => d.value > 0);
    
    // Fallback data if no valid data is provided
    if (validData.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [
          {
            data: [1],
            backgroundColor: [SEVENSA_COLORS.LIGHT_GRAY],
            borderColor: [SEVENSA_COLORS.LIGHT_GRAY],
            borderWidth: 1,
          },
        ],
      };
    }

    return {
      labels: validData.map(d => d.label),
      datasets: [
        {
          data: validData.map(d => d.value),
          backgroundColor: validData.map(d => d.color),
          borderColor: validData.map(d => d.color),
          borderWidth: 1,
        },
      ],
    };
  }, [data]);

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%', // Doughnut hole size
    plugins: {
      legend: {
        position: 'right',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed;
            const total = context.dataset.data.reduce((sum, val) => sum + (val as number), 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(2) : '0.00';
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className={`p-4 bg-white rounded-lg shadow-md ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="relative" style={{ height: 'calc(100% - 3rem)' }}>
        <Doughnut data={chartData} options={options} plugins={[centerTextPlugin]} />
      </div>
    </div>
  );
};

export default DoughnutChart;

// --- Example Usage (for reference, not part of the component file) ---
/*
const sampleData: DoughnutChartSegment[] = [
  { label: 'Marketing', value: 300, color: SEVENSA_COLORS.PRIMARY },
  { label: 'Sales', value: 150, color: SEVENSA_COLORS.SECONDARY },
  { label: 'Development', value: 50, color: '#F97316' }, // Example third color
];

<DoughnutChart
  title="Revenue Distribution"
  data={sampleData}
  className="max-w-md h-96"
/>
*/