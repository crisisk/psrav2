import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Sevensa Branding Colors
const PRIMARY_COLOR = '#00A896'; // Bar color, Line border color
const SECONDARY_COLOR = '#2D3A45'; // Line background color (for fill)

// Define the structure for the chart data
interface MixedChartData {
  labels: string[];
  barData: number[];
  lineData: number[];
}

// Define the component props
interface MixedChartProps {
  data: MixedChartData;
  title?: string;
}

// Helper function to generate the Chart.js data object
const generateChartData = (data: MixedChartData): ChartData<'bar' | 'line'> => {
  return {
    labels: data.labels,
    datasets: [
      {
        type: 'bar' as const,
        label: 'Bar Dataset (e.g., Sales)',
        backgroundColor: PRIMARY_COLOR,
        data: data.barData,
        borderColor: 'white',
        borderWidth: 2,
        yAxisID: 'y', // Primary Y-axis
      },
      {
        type: 'line' as const,
        label: 'Line Dataset (e.g., Revenue)',
        borderColor: PRIMARY_COLOR,
        borderWidth: 3,
        fill: true,
        backgroundColor: SECONDARY_COLOR + '40', // Secondary color with 40% opacity for fill
        data: data.lineData,
        yAxisID: 'y1', // Secondary Y-axis
        tension: 0.4, // Smooth line
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };
};

// Chart.js Options for responsiveness and styling
const options: ChartOptions<'bar' | 'line'> = {
  responsive: true,
  maintainAspectRatio: false, // Allows the container to control size
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: '#333', // Dark text for labels
      },
    },
    title: {
      display: true,
      text: 'Combined Sales and Revenue Performance',
      font: {
        size: 18,
        weight: 'bold',
      },
      color: '#2D3A45',
    },
    tooltip: {
      // Customizing tooltips for a professional look
      backgroundColor: 'rgba(45, 58, 69, 0.9)', // SECONDARY_COLOR with opacity
      titleColor: '#fff',
      bodyColor: '#fff',
      padding: 10,
      cornerRadius: 4,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: '#666',
      },
    },
    y: {
      type: 'linear' as const,
      display: true,
      position: 'left' as const,
      title: {
        display: true,
        text: 'Sales (Bar)',
        color: PRIMARY_COLOR,
      },
      ticks: {
        color: PRIMARY_COLOR,
      },
      grid: {
        color: '#eee',
      },
    },
    y1: {
      type: 'linear' as const,
      display: true,
      position: 'right' as const,
      title: {
        display: true,
        text: 'Revenue (Line)',
        color: SECONDARY_COLOR,
      },
      ticks: {
        color: SECONDARY_COLOR,
      },
      // grid line settings
      grid: {
        drawOnChartArea: false, // only draw grid lines for the left axis
      },
    },
  },
};

// Mock data for demonstration purposes
const mockData: MixedChartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
  barData: [65, 59, 80, 81, 56, 55, 40],
  lineData: [28, 48, 40, 19, 86, 27, 90],
};

/**
 * A production-ready, responsive, combined Line and Bar Chart component.
 * Uses Chart.js with react-chartjs-2 and styled with Tailwind CSS.
 * Features Sevensa branding colors and interactive tooltips.
 */
const MixedChart: React.FC<MixedChartProps> = ({ data, title }) => {
  const chartData = generateChartData(data);

  // Update the title in options if a prop is provided
  const chartOptions: ChartOptions<'bar' | 'line'> = {
    ...options,
    plugins: {
      ...options.plugins,
      title: {
        ...options.plugins?.title,
        text: title || options.plugins?.title?.text,
      },
    },
  };

  return (
    // Tailwind CSS for responsive container and styling
    <div className="p-4 bg-white shadow-lg rounded-lg w-full h-96 md:h-[500px] flex flex-col">
      <div className="flex-grow relative">
        {/* The Bar component from react-chartjs-2 handles both bar and line types */}
        <Bar data={chartData} options={chartOptions} />
      </div>
      <p className="text-center text-sm text-gray-500 mt-2">
        Data visualization powered by Chart.js
      </p>
    </div>
  );
};

// Default export for easy use
export default MixedChart;

// Export types and mock data for external use
export type { MixedChartData, MixedChartProps };
export { mockData };