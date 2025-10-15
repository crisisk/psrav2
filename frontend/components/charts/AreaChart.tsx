import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';


// Sevensa Branding Colors
const COLOR_PRIMARY = '#00A896'; // Sevensa Teal
const COLOR_SECONDARY = '#2D3A45'; // Sevensa Dark

// --- Data Model ---
interface ChartData {
  name: string;
  series1: number;
  series2: number;
}

// --- Custom Tooltip Component ---
const CustomTooltip = ({
  active,
  payload,
  label,
}: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white border border-gray-200 shadow-lg rounded-lg text-sm">
        <p className="font-bold text-gray-700 mb-1">{label}</p>
        {payload.map((item: { name: string, value: number, color: string }, index: number) => (
          <p key={`item-${index}`} className="flex justify-between items-center">
            <span
              className="inline-block w-2 h-2 mr-2 rounded-full"
              style={{ backgroundColor: item.color }}
            ></span>
            <span className="text-gray-600 font-medium">{item.name}:</span>
            <span className="ml-2 font-semibold text-gray-800">
              {item.value}
            </span>
          </p>
        ))}
      </div>
    );
  }

  return null;
};

// --- Component Props ---
interface AreaChartProps {
  data: ChartData[];
  width?: string | number;
  height?: string | number;
}

// --- Main Component ---
const MultiSeriesAreaChart: React.FC<AreaChartProps> = ({
  data,
  width = '100%',
  height = 300,
}) => {
  // Memoize the gradient definitions
  const gradientDefs = useMemo(
    () => (
      <defs>
        {/* Gradient for Series 1 (Primary Color) */}
        <linearGradient id="colorSeries1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={COLOR_PRIMARY} stopOpacity={0.8} />
          <stop offset="95%" stopColor={COLOR_PRIMARY} stopOpacity={0} />
        </linearGradient>

        {/* Gradient for Series 2 (Secondary Color) */}
        <linearGradient id="colorSeries2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={COLOR_SECONDARY} stopOpacity={0.8} />
          <stop offset="95%" stopColor={COLOR_SECONDARY} stopOpacity={0} />
        </linearGradient>
      </defs>
    ),
    []
  );

  return (
    <div style={{ width, height }} className="font-sans">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          {gradientDefs}
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="name" stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip content={<CustomTooltip />} />

          {/* Series 1: Primary Color */}
          <Area
            type="monotone"
            dataKey="series1"
            name="Primary Metric"
            stroke={COLOR_PRIMARY}
            fill="url(#colorSeries1)"
            strokeWidth={2}
            activeDot={{ r: 6, fill: COLOR_PRIMARY, stroke: '#fff', strokeWidth: 2 }}
          />

          {/* Series 2: Secondary Color */}
          <Area
            type="monotone"
            dataKey="series2"
            name="Secondary Metric"
            stroke={COLOR_SECONDARY}
            fill="url(#colorSeries2)"
            strokeWidth={2}
            activeDot={{ r: 6, fill: COLOR_SECONDARY, stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MultiSeriesAreaChart;

// --- Example Usage (for reference, not part of the component export) ---
/*
const sampleData: ChartData[] = [
  { name: 'Jan', series1: 4000, series2: 2400 },
  { name: 'Feb', series1: 3000, series2: 1398 },
  { name: 'Mar', series1: 2000, series2: 9800 },
  { name: 'Apr', series1: 2780, series2: 3908 },
  { name: 'May', series1: 1890, series2: 4800 },
  { name: 'Jun', series1: 2390, series2: 3800 },
  { name: 'Jul', series1: 3490, series2: 4300 },
];

function App() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Sevensa Multi-Series Area Chart</h1>
      <div className="w-full max-w-4xl h-80">
        <MultiSeriesAreaChart data={sampleData} />
      </div>
    </div>
  );
}
*/