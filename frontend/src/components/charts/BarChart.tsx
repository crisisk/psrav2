import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import {
  ValueType,
  NameType,
} from 'recharts/types/component/Tooltip';

// --- Branding Colors ---
// Sevensa Primary: #00A896 (A vibrant teal/green)
// Sevensa Secondary: #2D3A45 (A dark slate/charcoal)
const SEVENSA_COLORS = ['#00A896', '#2D3A45', '#4A90E2', '#F5A623', '#BD10E0'];

// --- TypeScript Interfaces ---

/**
 * Interface for a single data point in the chart.
 * The keys are dynamic, but must include the X-axis key.
 */
export interface ChartData {
  [key: string]: string | number;
}

/**
 * Interface for a single bar series configuration.
 */
export interface BarSeries {
  /** The key in the data object that represents this series' value. */
  dataKey: string;
  /** The display name for this series in the legend and tooltip. */
  name: string;
  /** The color for this series. If not provided, it will use a color from SEVENSA_COLORS. */
  color?: string;
}

/**
 * Props for the BarChart component.
 */
export interface BarChartProps {
  /** The data array for the chart. */
  data: ChartData[];
  /** The key in the data object to use for the X-axis (category axis). */
  xAxisDataKey: string;
  /** Configuration for the bar series to display. */
  series: BarSeries[];
  /** The orientation of the bars. 'vertical' (default) or 'horizontal'. */
  orientation?: 'vertical' | 'horizontal';
  /** Whether the bars should be stacked. */
  stacked?: boolean;
  /** Optional title for the chart. */
  title?: string;
}

// --- Custom Tooltip Component ---

const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white border border-gray-200 shadow-lg rounded-md text-sm">
        <p className="font-bold text-gray-700 mb-1">{label}</p>
        {payload.map((p, index) => (
          <p key={index} className="flex justify-between items-center">
            <span className="mr-2" style={{ color: p.color }}>
              {p.name}:
            </span>
            <span className="font-medium text-gray-900">{p.value}</span>
          </p>
        ))}
      </div>
    );
  }

  return null;
};

// --- Main Component ---

const BarChart: React.FC<BarChartProps> = ({
  data,
  xAxisDataKey,
  series,
  orientation = 'vertical',
  stacked = false,
  title,
}) => {
  const isVertical = orientation === 'vertical';
  const layout = isVertical ? 'horizontal' : 'vertical';

  // Determine which axis is the category axis (X for vertical, Y for horizontal)
  const CategoryAxis = isVertical ? XAxis : YAxis;
  // Determine which axis is the value axis (Y for vertical, X for horizontal)
  const ValueAxis = isVertical ? YAxis : XAxis;

  // Assign colors to series, cycling through SEVENSA_COLORS
  const coloredSeries = series.map((s, index) => ({
    ...s,
    color: s.color || SEVENSA_COLORS[index % SEVENSA_COLORS.length],
  }));

  return (
    <div className="w-full h-96 p-4 bg-white rounded-lg shadow-xl">
      {title && (
        <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={isVertical ? '90%' : '100%'}>
        <RechartsBarChart
          data={data}
          layout={layout}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />

          {/* Category Axis (X for vertical, Y for horizontal) */}
          <CategoryAxis
            dataKey={xAxisDataKey}
            type={isVertical ? 'category' : 'number'}
            stroke="#6B7280"
            className="text-xs"
            // For horizontal bar chart, the YAxis is the category axis
            {...(!isVertical && { type: 'category' })}
          />

          {/* Value Axis (Y for vertical, X for horizontal) */}
          <ValueAxis
            type={isVertical ? 'number' : 'category'}
            stroke="#6B7280"
            className="text-xs"
            // For horizontal bar chart, the XAxis is the value axis
            {...(isVertical && { type: 'number' })}
          />

          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '10px' }} />

          {coloredSeries.map((s, index) => (
            <Bar
              key={s.dataKey}
              dataKey={s.dataKey}
              name={s.name}
              fill={s.color}
              stackId={stacked ? 'a' : undefined}
              // Animation properties (default is fine, but can be customized)
              isAnimationActive={true}
              animationDuration={1000}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChart;