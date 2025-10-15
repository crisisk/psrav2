import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// --- Types and Interfaces ---

// Data structure for the sparkline
interface SparklineDataPoint {
  x: number;
  y: number;
}

// Props for the KPITile component
interface KPITileProps {
  title: string;
  value: string | number;
  unit?: string;
  trend: 'up' | 'down' | 'neutral';
  comparisonValue: string | number;
  comparisonPeriod: string;
  sparklineData: SparklineDataPoint[];
  isLoading?: boolean;
}


// --- Utility Components ---

// 1. Trend Indicator Icon
const TrendIcon: React.FC<{ trend: KPITileProps['trend'] }> = ({ trend }) => {
  const baseClasses = 'w-4 h-4 mr-1';
  switch (trend) {
    case 'up':
      return <ArrowUp className={`${baseClasses} text-green-500`} />;
    case 'down':
      return <ArrowDown className={`${baseClasses} text-red-500`} />;
    case 'neutral':
    default:
      return <Minus className={`${baseClasses} text-gray-400`} />;
  }
};

// 2. Sparkline Component (Simple SVG implementation)
const Sparkline: React.FC<{ data: SparklineDataPoint[]; trend: KPITileProps['trend'] }> = ({ data, trend }) => {
  if (!data || data.length < 2) {
    return <div className="h-10 w-full flex items-center justify-center text-xs text-gray-400">No data</div>;
  }

  const values = data.map(p => p.y);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min === 0 ? 1 : max - min;
  const width = 100; // Fixed width for the SVG viewbox
  const height = 40; // Fixed height for the SVG viewbox
  const pointCount = data.length;

  const points = data.map((point, index) => {
    const x = (index / (pointCount - 1)) * width;
    const y = height - ((point.y - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const strokeColor = trend === 'up' ? 'rgb(34, 197, 94)' : trend === 'down' ? 'rgb(239, 68, 68)' : 'rgb(156, 163, 175)'; // Tailwind colors

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-10">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
};

// 3. Loading Skeleton
const LoadingSkeleton: React.FC = () => (
  <div className="p-6 bg-white rounded-lg shadow-lg border border-gray-100 animate-pulse border-sevensa-primary">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
    <div className="h-10 bg-gray-300 rounded w-1/2 mb-6"></div>
    <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
  </div>
);

// --- Main Component ---

const KPITile: React.FC<KPITileProps> = ({
  title,
  value,
  unit,
  trend,
  comparisonValue,
  comparisonPeriod,
  sparklineData,
  isLoading = false,
}) => {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400';

  return (
    <motion.div
      className="p-6 bg-white rounded-lg shadow-xl border-t-4 transition-all duration-300 hover:shadow-2xl border-t-sevensa-primary"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Title */}
      <h3 className="text-sm font-medium uppercase tracking-wider text-sevensa-secondary">
        {title}
      </h3>

      {/* Value */}
      <motion.div
        className="flex items-baseline my-2"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <span className="text-4xl font-bold text-sevensa-secondary">
          {value}
        </span>
        {unit && <span className="ml-1 text-lg font-semibold text-gray-500">{unit}</span>}
      </motion.div>

      {/* Sparkline */}
      <div className="h-10 mb-4">
        <Sparkline data={sparklineData} trend={trend} />
      </div>

      {/* Comparison to Previous Period */}
      <div className="flex items-center text-sm">
        <TrendIcon trend={trend} />
        <span className={`font-semibold ${trendColor}`}>
          {comparisonValue}
        </span>
        <span className="ml-1 text-gray-500">
          vs. {comparisonPeriod}
        </span>
      </div>
    </motion.div>
  );
};

export default KPITile;