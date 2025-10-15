import React, { useMemo } from 'react';
import {
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';

// Custom component for the Candlestick element
// Recharts doesn't have a native Candlestick component, so we use a custom shape
// or a combination of ReferenceArea and ReferenceLine.
// For simplicity and to meet the requirements with Recharts, we will use a
// combination of a custom shape and a composed chart structure.

// --- Types ---

export interface CandlestickData {
  /** Timestamp or date string for the x-axis */
  date: string;
  /** Opening price */
  open: number;
  /** Highest price */
  high: number;
  /** Lowest price */
  low: number;
  /** Closing price */
  close: number;
}

export interface CandlestickChartProps {
  /** Array of candlestick data points */
  data: CandlestickData[];
  /** Width of the chart container (Tailwind class or fixed value) */
  widthClass?: string;
  /** Height of the chart container (Tailwind class or fixed value) */
  heightClass?: string;
}

// --- Constants ---

// Sevensa Branding Colors
const COLOR_BULLISH = '#00A896'; // Green
const COLOR_BEARISH = '#EF4444'; // Standard Red for contrast (Tailwind red-500)
const COLOR_BACKGROUND = '#2D3A45'; // Dark background/text color

// --- Custom Tooltip Component ---

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload as CandlestickData;
    const isBullish = dataPoint.close >= dataPoint.open;
    const color = isBullish ? COLOR_BULLISH : COLOR_BEARISH;

    return (
      <div className="p-3 bg-white/90 dark:bg-gray-800/90 border border-gray-300 dark:border-gray-700 shadow-lg rounded-md text-sm font-mono">
        <p className="font-bold text-base mb-1" style={{ color }}>{`${label}`}</p>
        <p>Open: <span className="font-semibold">{dataPoint.open.toFixed(2)}</span></p>
        <p>High: <span className="font-semibold">{dataPoint.high.toFixed(2)}</span></p>
        <p>Low: <span className="font-semibold">{dataPoint.low.toFixed(2)}</span></p>
        <p>Close: <span className="font-semibold">{dataPoint.close.toFixed(2)}</span></p>
      </div>
    );
  }

  return null;
};

// --- Custom Candlestick Shape Component ---

const Candlestick: React.FC<any> = (props) => {
  const { x, y, width, high, low, open, close, index, data } = props;

  // Determine if the candle is bullish (close >= open) or bearish (close < open)
  const isBullish = close >= open;
  const fill = isBullish ? COLOR_BULLISH : COLOR_BEARISH;

  // Calculate the body of the candle (the rectangle)
  const bodyY = Math.min(open, close);
  const bodyHeight = Math.abs(open - close);

  // Calculate the wick (the line)
  const wickX = x + width / 2;

  return (
    <g>
      {/* Wick (High to Low) */}
      <line
        x1={wickX}
        y1={props.yAxis.scale(high)}
        x2={wickX}
        y2={props.yAxis.scale(low)}
        stroke={fill}
        strokeWidth={1}
      />
      {/* Body (Open to Close) */}
      <rect
        x={x}
        y={props.yAxis.scale(bodyY)}
        width={width}
        height={props.yAxis.scale(bodyY + bodyHeight) - props.yAxis.scale(bodyY)}
        fill={fill}
        stroke={fill}
      />
    </g>
  );
};

// --- Main Component ---

const CandlestickChart: React.FC<CandlestickChartProps> = ({
  data,
  widthClass = 'w-full',
  heightClass = 'h-96',
}) => {
  // Recharts requires a data key for the XAxis, which is 'date' in our case.
  // The custom Candlestick component will handle the OHLC data.

  // To properly render the custom Candlestick component, we need to pass the
  // full OHLC data to it. Recharts' ComposedChart is used to provide the
  // necessary context (like axis scales) to the custom shape.

  // We use a dummy data key for the chart series to ensure the XAxis is correctly
  // populated and the CustomTooltip works. We'll use 'close' as the dummy key.
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      // Recharts needs a single value for the series, we use close, but it's not drawn.
      // The custom shape draws the actual candle.
      value: item.close,
    }));
  }, [data]);

  return (
    <div className={`${widthClass} ${heightClass} p-4 bg-white dark:bg-gray-900 rounded-lg shadow-xl`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" /> {/* Gray-600 for dark theme */}
          <XAxis
            dataKey="date"
            tick={{ fill: COLOR_BACKGROUND }}
            tickLine={{ stroke: COLOR_BACKGROUND }}
            axisLine={{ stroke: COLOR_BACKGROUND }}
            // Example for date formatting (optional, depends on date format)
            // tickFormatter={(tick) => new Date(tick).toLocaleDateString()}
          />
          <YAxis
            domain={['dataMin', 'dataMax']}
            tick={{ fill: COLOR_BACKGROUND }}
            tickLine={{ stroke: COLOR_BACKGROUND }}
            axisLine={{ stroke: COLOR_BACKGROUND }}
          />
          <Tooltip content={<CustomTooltip />} />

          {/*
            The ReferenceArea is a trick to get Recharts to render a custom shape
            at the correct X-axis positions. We use the 'date' as the dataKey
            and pass the custom Candlestick component as the shape.
          */}
          <ReferenceArea
            x1={chartData[0]?.date}
            x2={chartData[chartData.length - 1]?.date}
            fill="transparent"
            shape={<Candlestick data={data} />}
          />

          {/* Optional: Add a reference line for a key price level, e.g., the first open price */}
          {chartData.length > 0 && (
            <ReferenceLine
              y={chartData[0].open}
              stroke={COLOR_BULLISH}
              strokeDasharray="5 5"
              label={{
                value: `Start: ${chartData[0].open.toFixed(2)}`,
                position: 'right',
                fill: COLOR_BULLISH,
                fontSize: 12,
              }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CandlestickChart;