import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

// Sevensa Branding Colors
const SEVENSA_PRIMARY = '#00A896'; // Teal
const SEVENSA_SECONDARY = '#2D3A45'; // Dark Slate

// 1. Define the data structure
interface SparklineData {
  name: string | number;
  value: number;
}

// 2. Define the component props
interface SparklineChartProps {
  data: SparklineData[];
  width?: string | number;
  height?: string | number;
  type?: 'line' | 'area';
  color?: string;
  showTooltip?: boolean;
  className?: string;
}

// 3. Custom Tooltip Component for better styling
// The 'any' type is used for Recharts props which are not strictly typed in the library
const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0];
    return (
      // Tailwind CSS for styling the tooltip
      <div className="p-2 bg-white border border-gray-200 shadow-lg rounded-md text-xs font-mono text-gray-800">
        <p className="font-bold">{dataPoint.value.toLocaleString()}</p>
        <p className="text-gray-500">{label}</p>
      </div>
    );
  }
  return null;
};

// 4. SparklineChart Component
const SparklineChart: React.FC<SparklineChartProps> = ({
  data,
  width = '100%',
  height = 30, // Default compact height for a sparkline
  type = 'line',
  color = SEVENSA_PRIMARY,
  showTooltip = true,
  className = '',
}) => {
  // Determine the component to use based on the type prop
  const ChartComponent = type === 'area' ? AreaChart : LineChart;

  // Calculate min/max for domain to ensure the chart uses the full range of data
  const domain = useMemo(() => {
    if (!data || data.length === 0) return [0, 100];
    const values = data.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    // Add a small buffer to the min/max for better visualization
    const buffer = (max - min) * 0.1;
    // Ensure the min is not negative if all values are positive
    const finalMin = Math.max(0, min - buffer);
    return [finalMin, max + buffer];
  }, [data]);

  return (
    // Outer div for setting fixed width/height if provided, and applying Tailwind classes
    <div className={`sparkline-chart ${className}`} style={{ width, height }}>
      {/* ResponsiveContainer ensures the chart scales within the parent div */}
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent
          data={data}
          // Minimal margin for a compact sparkline
          margin={{ top: 1, right: 1, left: 1, bottom: 1 }}
        >
          {/* Hidden axes for a clean sparkline look */}
          <XAxis dataKey="name" hide />
          <YAxis hide domain={domain} />

          {/* Interactive Tooltip */}
          {showTooltip && (
            <Tooltip
              content={<CustomTooltip />}
              // Use the secondary brand color for the cursor line
              cursor={{ stroke: SEVENSA_SECONDARY, strokeWidth: 1, strokeDasharray: '3 3' }}
            />
          )}

          {/* The actual data line/area */}
          {type === 'line' ? (
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false} // No dots for a clean sparkline
              // Active dot uses the primary color with a white stroke for visibility
              activeDot={{ r: 4, fill: color, stroke: 'white', strokeWidth: 2 }}
            />
          ) : (
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              fill={color}
              fillOpacity={0.3} // Light fill for the area
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: color, stroke: 'white', strokeWidth: 2 }}
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
};

// Export as default
export default SparklineChart;