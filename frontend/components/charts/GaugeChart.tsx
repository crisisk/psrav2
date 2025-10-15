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

// Sevensa Branding Colors
const SEVENSA_PRIMARY = '#00A896';
const SEVENSA_SECONDARY = '#2D3A45';
const BACKGROUND_COLOR = '#e5e7eb'; // Light gray for the remaining arc

interface GaugeChartProps {
  value: number;
  max: number;
  label: string;
  unit?: string;
  size?: 'sm' | 'md' | 'lg';
}

const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  max,
  label,
  unit = '%',
  size = 'md',
}) => {
  // Ensure value is within the 0 to max range
  const normalizedValue = Math.min(Math.max(0, value), max);
  const remaining = max - normalizedValue;

  // Determine chart size based on prop for Tailwind CSS
  const chartSize = useMemo(() => {
    switch (size) {
      case 'sm':
        return 'h-32 w-32';
      case 'lg':
        return 'h-64 w-64';
      case 'md':
      default:
        return 'h-48 w-48';
    }
  }, [size]);

  // Chart Data
  const data: ChartData<'doughnut'> = {
    labels: [label, 'Remaining'],
    datasets: [
      {
        data: [normalizedValue, remaining],
        backgroundColor: [SEVENSA_PRIMARY, BACKGROUND_COLOR],
        borderColor: [SEVENSA_PRIMARY, BACKGROUND_COLOR],
        borderWidth: 0,

      },
    ],
  };

  // Custom Plugin to draw the center text (value and label)
  const centerTextPlugin: Plugin<'doughnut'> = useMemo(() => ({
    id: 'centerText',
    beforeDraw(chart) {
      const { ctx, chartArea: { width, height } } = chart;
      ctx.save();

      // Calculate center position, adjusting for the half-doughnut
      const centerX = width / 2;
      const centerY = height / 2 + 10; 

      // Current Value Text
      ctx.font = 'bold 24px sans-serif';
      ctx.fillStyle = SEVENSA_SECONDARY;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${normalizedValue}${unit}`, centerX, centerY - 10);

      // Label Text
      ctx.font = '14px sans-serif';
      ctx.fillStyle = SEVENSA_SECONDARY;
      ctx.fillText(label, centerX, centerY + 15);

      ctx.restore();
    },
  }), [normalizedValue, label, unit]);

  // Chart Options
  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    rotation: 270, // Start the chart at the bottom (for gauge effect)
    circumference: 180, // Only show the top half (180 degrees)
    cutout: '80%', // Thickness of the arc
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context) => {
            const labelText = context.label || '';
            const valueText = context.formattedValue;
            // Only show tooltip for the actual value, not the remaining arc
            if (labelText === 'Remaining') {
              return ''; 
            }
            return `${labelText}: ${valueText}${unit}`;
          },
        },
      },
    },
  };

  return (
    <div className={`relative flex justify-center items-center ${chartSize}`}>
      <Doughnut data={data} options={options} plugins={[centerTextPlugin]} />
    </div>
  );
};

export default GaugeChart;