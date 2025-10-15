import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
  Scatter,
  Tooltip,
  CartesianGrid,
} from 'recharts';

// --- Types ---

/**
 * Defines the structure for a single data point in the heatmap.
 * @property x - The value for the X-axis (e.g., day of the week).
 * @property y - The value for the Y-axis (e.g., hour of the day).
 * @property z - The metric value that determines the color intensity (e.g., count, volume).
 * @property label - A descriptive label for the tooltip.
 */
export interface HeatMapDataPoint {
  x: string | number;
  y: string | number;
  z: number;
  label?: string;
}

/**
 * Defines the props for the HeatMapChart component.
 * @property data - The array of data points.
 * @property xKey - The key in the data object for the X-axis.
 * @property yKey - The key in the data object for the Y-axis.
 * @property zKey - The key in the data object for the Z-axis (value).
 * @property xLabel - Label for the X-axis.
 * @property yLabel - Label for the Y-axis.
 * @property colorRange - An array of two colors for the gradient [minColor, maxColor].
 */
export interface HeatMapChartProps {
  data: HeatMapDataPoint[];
  xKey: keyof HeatMapDataPoint;
  yKey: keyof HeatMapDataPoint;
  zKey: keyof HeatMapDataPoint;
  xLabel: string;
  yLabel: string;
  colorRange?: [string, string];
}

// --- Constants ---

// Sevensa branding colors
const SEVENSA_PRIMARY = '#00A896'; // Teal
const SEVENSA_DARK = '#2D3A45'; // Dark Slate

// Default color range for the heatmap gradient
const DEFAULT_COLOR_RANGE: [string, string] = ['#E0F2F1', SEVENSA_PRIMARY]; // Light Teal to Primary Teal

// --- Utility Functions ---

/**
 * Interpolates a color between two colors based on a value's position in a range.
 * @param minColor - The color for the minimum value.
 * @param maxColor - The color for the maximum value.
 * @param value - The current value.
 * @param minZ - The minimum possible Z value.
 * @param maxZ - The maximum possible Z value.
 * @returns A hex color string.
 */
const interpolateColor = (
  minColor: string,
  maxColor: string,
  value: number,
  minZ: number,
  maxZ: number
): string => {
  if (maxZ === minZ) return maxColor; // Avoid division by zero
  const ratio = (value - minZ) / (maxZ - minZ);

  const hexToRgb = (hex: string) =>
    hex.match(/\w\w/g)?.map((x) => parseInt(x, 16)) || [0, 0, 0];
  const rgbToHex = (r: number, g: number, b: number) =>
    '#' + [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('');

  const [r1, g1, b1] = hexToRgb(minColor);
  const [r2, g2, b2] = hexToRgb(maxColor);

  const r = r1 + (r2 - r1) * ratio;
  const g = g1 + (g2 - g1) * ratio;
  const b = b1 + (b2 - b1) * ratio;

  return rgbToHex(r, g, b);
};

// --- Custom Components ---

/**
 * Custom Dot component to render the colored squares (cells) of the heatmap.
 */
const HeatMapCell: React.FC<any> = (props) => {
  const { cx, cy, payload, zKey, minZ, maxZ, colorRange } = props;
  const value = payload[zKey];
  const [minColor, maxColor] = colorRange;

  const color = interpolateColor(minColor, maxColor, value, minZ, maxZ);

  // The size of the square. Using a fixed size for demonstration,
  // but in a real scenario, this might be calculated based on the number of data points.
  const size = 20;

  return (
    <rect
      x={cx - size / 2}
      y={cy - size / 2}
      width={size}
      height={size}
      fill={color}
      stroke={SEVENSA_DARK}
      strokeWidth={0.5}
      className="transition-all duration-200 hover:scale-110"
    />
  );
};

/**
 * Custom Tooltip component for a clean, branded look.
 */
const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const value = dataPoint.z;
    const xValue = dataPoint.x;
    const yValue = dataPoint.y;
    const tooltipLabel = dataPoint.label || `${xValue} / ${yValue}`;

    return (
      <div className="p-3 bg-white border border-gray-200 shadow-lg rounded-md text-sm font-sans">
        <p className="font-bold text-base text-gray-800 mb-1">{tooltipLabel}</p>
        <p className="text-gray-600">
          <span className="font-medium">Value:</span>{' '}
          <span className="text-lg font-semibold text-teal-600">{value}</span>
        </p>
      </div>
    );
  }

  return null;
};

// --- Main Component ---

/**
 * A responsive HeatMap component built with Recharts and styled with Tailwind CSS.
 * It visualizes data intensity using a color gradient based on the Z-axis value.
 */
const HeatMapChart: React.FC<HeatMapChartProps> = ({
  data,
  xKey,
  yKey,
  zKey,
  xLabel,
  yLabel,
  colorRange = DEFAULT_COLOR_RANGE,
}) => {
  // Calculate min and max Z values for color interpolation
  const { minZ, maxZ } = useMemo(() => {
    const zValues = data.map((d) => d[zKey] as number);
    return {
      minZ: Math.min(...zValues),
      maxZ: Math.max(...zValues),
    };
  }, [data, zKey]);

  // Extract unique X and Y values to define the grid structure
  const xValues = useMemo(() => Array.from(new Set(data.map((d) => d[xKey]))).sort(), [data, xKey]);
  const yValues = useMemo(() => Array.from(new Set(data.map((d) => d[yKey]))).sort(), [data, yKey]);

  // Custom Tick component to style axis labels with Tailwind
  const CustomAxisTick: React.FC<any> = ({ x, y, payload, orientation }) => {
    const isYAxis = orientation === 'left';
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={isYAxis ? 5 : 16}
          textAnchor={isYAxis ? 'end' : 'middle'}
          fill={SEVENSA_DARK}
          className="text-xs font-medium"
        >
          {payload.value}
        </text>
      </g>
    );
  };

  return (
    <div className="w-full h-96 p-4 bg-white rounded-lg shadow-xl font-sans">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          margin={{
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

          {/* X-Axis (Bottom) */}
          <XAxis
            type="category"
            dataKey={xKey}
            name={xLabel}
            tickLine={false}
            axisLine={{ stroke: SEVENSA_DARK }}
            tick={<CustomAxisTick orientation="bottom" />}
            domain={[0, xValues.length]}
            interval={0}
          />

          {/* Y-Axis (Left) */}
          <YAxis
            type="category"
            dataKey={yKey}
            name={yLabel}
            tickLine={false}
            axisLine={{ stroke: SEVENSA_DARK }}
            tick={<CustomAxisTick orientation="left" />}
            domain={[0, yValues.length]}
            interval={0}
          />

          {/* Z-Axis (Value for Color) - Hidden, used for data binding */}
          <ZAxis type="number" dataKey={zKey} range={[minZ, maxZ]} />

          {/* Interactive Tooltip */}
          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />

          {/* Scatter plot to render the heatmap cells */}
          <Scatter
            name="Heatmap Data"
            data={data}
            fill={SEVENSA_PRIMARY}
            shape={
              <HeatMapCell
                zKey={zKey}
                minZ={minZ}
                maxZ={maxZ}
                colorRange={colorRange}
              />
            }
          />
        </ScatterChart>
      </ResponsiveContainer>
      {/* Optional: Add a simple legend/color bar */}
      <div className="flex justify-center items-center mt-2 text-sm text-gray-600">
        <span className="mr-2">Low ({minZ})</span>
        <div
          className="w-24 h-3 rounded-full"
          style={{
            background: `linear-gradient(to right, ${colorRange[0]}, ${colorRange[1]})`,
          }}
        ></div>
        <span className="ml-2">High ({maxZ})</span>
      </div>
    </div>
  );
};

export default HeatMapChart;