import React from 'react';
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, Info } from 'lucide-react';

interface KPITileProps {
  title: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  variant: 'teal' | 'success' | 'warning' | 'error';
  description?: string;
}

const variantClasses = {
  teal: {
    bg: 'bg-sevensa-teal/10',
    text: 'text-sevensa-teal',
    icon: 'text-sevensa-teal',
  },
  success: {
    bg: 'bg-sevensa-success/10',
    text: 'text-sevensa-success',
    icon: 'text-sevensa-success',
  },
  warning: {
    bg: 'bg-sevensa-warning/10',
    text: 'text-sevensa-warning',
    icon: 'text-sevensa-warning',
  },
  error: {
    bg: 'bg-sevensa-error/10',
    text: 'text-sevensa-error',
    icon: 'text-sevensa-error',
  },
};

const KPITile: React.FC<KPITileProps> = ({
  title,
  value,
  trend,
  trendValue,
  variant,
  description,
}) => {
  const classes = variantClasses[variant];
  const TrendIcon = trend === 'up' ? ArrowUp : ArrowDown;
  const TrendColor = trend === 'up' ? 'text-sevensa-success' : 'text-sevensa-error';

  return (
    <div className="p-6 bg-white rounded-lg shadow-sevensa-lg border border-gray-100 transition-all hover:shadow-sevensa">
      {/* Title and Info Icon */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {description && (
          <Info className="w-4 h-4 text-gray-400 cursor-pointer" title={description} />
        )}
      </div>

      {/* Main Value */}
      <div className="text-3xl font-bold text-sevensa-dark mb-4">{value}</div>

      {/* Trend Indicator */}
      <div className="flex items-center text-sm">
        <span className={`flex items-center font-medium mr-2 ${TrendColor}`}>
          <TrendIcon className="w-4 h-4 mr-1" />
          {trendValue}
        </span>
        <span className="text-gray-500">vs. last period</span>
      </div>
    </div>
  );
};

export default KPITile;
