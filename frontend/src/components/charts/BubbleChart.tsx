import React, { useMemo } from 'react';
import { Bubble } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
  BubbleDataPoint,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

// --- Branding Colors ---
const SEVENSA_TEAL = '#00A896';
const SEVENSA_DARK = '#2D3A45';

// --- TypeScript Interfaces ---

/**
 * Defines the structure for a single data point in the bubble chart.
 * r represents the radius (size) of the bubble.
 */
export interface BubbleData {
  x: number;
  y: number;
  r: number;
}

/**
 * Defines the structure for a single dataset in the bubble chart.
 */
export interface BubbleDataset {
  label: string;
  data: BubbleData[];
  backgroundColor?: string;
  borderColor?: string;
}

/**
 * Defines the props for the BubbleChart component.
 */
export interface BubbleChartProps {
  title?: string;
  datasets: BubbleDataset[];
  className?: string;
}

// --- Chart Configuration ---

const options: ChartOptions<'bubble'> = {
  responsive: true,
  maintainAspectRatio: false, // Allows the chart to fill the container
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: SEVENSA_DARK,
        font: {
          family: 'sans-serif',
        },
      },
    },
    tooltip: {
      // Interactive tooltips are enabled by default
      backgroundColor: SEVENSA_DARK,
      titleColor: SEVENSA_TEAL,
      bodyColor: '#ffffff',
      callbacks: {
        label: (context) => {
          const point = context.raw as BubbleDataPoint;
          return [
            `${context.dataset.label}`,
            `X-Value: ${point.x}`,
            `Y-Value: ${point.y}`,
            `Size (Radius): ${point.r}`,
          ];
        },
      },
    },
  },
  scales: {
    x: {
      type: 'linear' as const,
      position: 'bottom',
      title: {
        display: true,
        text: 'X-Axis Data',
        color: SEVENSA_DARK,
      },
      grid: {
        color: 'rgba(45, 58, 69, 0.1)', // Light grid lines
      },
      ticks: {
        color: SEVENSA_DARK,
      },
    },
    y: {
      type: 'linear' as const,
      title: {
        display: true,
        text: 'Y-Axis Data',
        color: SEVENSA_DARK,
      },
      grid: {
        color: 'rgba(45, 58, 69, 0.1)',
      },
      ticks: {
        color: SEVENSA_DARK,
      },
    },
  },
};

/**
 * A responsive Bubble Chart component using Chart.js and Tailwind CSS.
 * Data is 3D: x, y, and size (r).
 */
const BubbleChart: React.FC<BubbleChartProps> = ({ title, datasets, className = '' }) => {
  // Memoize the chart data to prevent unnecessary re-renders
  const chartData: ChartData<'bubble', BubbleDataPoint[]> = useMemo(() => {
    // Apply Sevensa branding colors if not explicitly provided in the dataset
    const brandedDatasets = datasets.map((dataset, index) => ({
      ...dataset,
      // Alternate between the two branding colors for background and border
      backgroundColor: dataset.backgroundColor || (index % 2 === 0 ? SEVENSA_TEAL : SEVENSA_DARK),
      borderColor: dataset.borderColor || (index % 2 === 0 ? SEVENSA_TEAL : SEVENSA_DARK),
      // Set a slight transparency for the fill color
      pointBackgroundColor: dataset.backgroundColor || (index % 2 === 0 ? SEVENSA_TEAL + 'B3' : SEVENSA_DARK + 'B3'), // B3 is ~70% opacity
      pointBorderColor: dataset.borderColor || (index % 2 === 0 ? SEVENSA_TEAL : SEVENSA_DARK),
      pointHoverBackgroundColor: dataset.backgroundColor || (index % 2 === 0 ? SEVENSA_TEAL : SEVENSA_DARK),
      pointHoverBorderColor: '#ffffff', // White border on hover for contrast
    }));

    return {
      datasets: brandedDatasets as any, // Cast to any to satisfy ChartData type complexity
    };
  }, [datasets]);

  return (
    // Tailwind CSS for responsive container and styling
    <div className={`p-4 bg-white shadow-lg rounded-lg ${className}`}>
      {title && (
        <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2">
          {title}
        </h2>
      )}
      {/* Chart container with a defined height for responsiveness */}
      <div className="relative h-96 w-full">
        <Bubble data={chartData} options={options} />
      </div>
    </div>
  );
};

export default BubbleChart;