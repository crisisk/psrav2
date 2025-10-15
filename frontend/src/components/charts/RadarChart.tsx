import React from 'react';
import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// --- Type Definitions ---

/**
 * Defines the structure for a single data point in the Radar Chart.
 * It must include a 'subject' (the axis label) and then any number of
 * keys for the data series (e.g., 'A', 'B').
 */
export interface RadarDataPoint {
  subject: string;
  [key: string]: string | number;
}

/**
 * Defines the structure for a single data series to be plotted.
 */
export interface RadarSeries {
  key: string; // The key in RadarDataPoint that holds the value for this series
  name: string; // Display name for the legend and tooltip
  color: string; // Color for the stroke and fill
}

/**
 * Props for the RadarChart component.
 */
export interface RadarChartProps {
  data: RadarDataPoint[];
  series: RadarSeries[];
  width?: number;
  height?: number;
  className?: string;
}

// --- Constants ---

// Sevensa branding colors
const SEVENSA_COLOR_PRIMARY = '#00A896'; // Teal
const SEVENSA_COLOR_SECONDARY = '#2D3A45'; // Dark Slate

// Default series configuration if none are provided
const DEFAULT_SERIES: RadarSeries[] = [
  { key: 'A', name: 'Series A', color: SEVENSA_COLOR_PRIMARY },
  { key: 'B', name: 'Series B', color: SEVENSA_COLOR_SECONDARY },
];

// --- Custom Tooltip Component ---

// Custom tooltip to ensure Tailwind CSS is applied correctly and for better styling
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-white border border-gray-300 shadow-lg rounded-md text-sm">
        <p className="font-bold text-gray-700 mb-1">{label}</p>
        {payload.map((p: any, index: number) => (
          <p key={index} style={{ color: p.color }} className="flex items-center">
            <span className="inline-block w-2 h-2 mr-2 rounded-full" style={{ backgroundColor: p.color }}></span>
            {p.name}: <span className="font-semibold ml-1">{p.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// --- RadarChart Component ---

const RadarChart: React.FC<RadarChartProps> = ({
  data,
  series = DEFAULT_SERIES,
  width = 500,
  height = 300,
  className = '',
}) => {
  if (!data || data.length === 0) {
    return <div className={`flex items-center justify-center ${className}`} style={{ width, height }}>No data available</div>;
  }

  // Determine the maximum value across all data points and series for PolarRadiusAxis domain
  const allValues = data.flatMap(d => series.map(s => d[s.key] as number));
  const maxValue = Math.max(...allValues, 0);
  const domainMax = maxValue > 0 ? Math.ceil(maxValue * 1.1) : 100; // Add 10% padding or default to 100

  return (
    <div className={`w-full h-full ${className}`} style={{ minHeight: height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#e5e7eb" /> {/* Light gray grid */}
          <PolarAngleAxis dataKey="subject" className="text-xs text-gray-600" />
          <PolarRadiusAxis domain={[0, domainMax]} angle={30} tickCount={5} />
          
          {series.map((s, index) => (
            <Radar
              key={s.key}
              name={s.name}
              dataKey={s.key}
              stroke={s.color}
              fill={s.color}
              fillOpacity={0.6}
              strokeWidth={2}
            />
          ))}

          <Tooltip content={<CustomTooltip />} />
          
          <Legend 
            wrapperStyle={{ paddingTop: '10px' }}
            iconType="circle"
            className="text-sm"
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RadarChart;