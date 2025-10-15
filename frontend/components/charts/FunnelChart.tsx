import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';

// 1. Define the data structure
interface FunnelData {
  name: string;
  value: number;
  fillColor?: string;
}

// 2. Define the component props
interface FunnelChartProps {
  data: FunnelData[];
  title?: string;
  className?: string;
}

// Sevensa Branding Colors
const SEVENSA_PRIMARY = '#00A896'; // Teal
const SEVENSA_SECONDARY = '#2D3A45'; // Dark Slate

// Custom Tooltip component for better styling and conversion rate display
const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const funnelData = payload.filter((p: any) => p.dataKey === 'value');
    const value = funnelData.length > 0 ? funnelData[0].value : 0;
    
    // Calculate conversion rate from the previous stage
    let conversionRate = 'N/A';
    if (dataPoint.previousValue) {
      conversionRate = ((value / dataPoint.previousValue) * 100).toFixed(1) + '%';
    }

    return (
      <div className="p-3 bg-white border border-gray-300 shadow-lg rounded-md text-sm">
        <p className="font-bold text-gray-700">{label}</p>
        <p className="text-gray-600">
          Value: <span className="font-semibold">{value.toLocaleString()}</span>
        </p>
        {dataPoint.previousValue && (
          <p className="text-gray-600">
            Conversion: <span className="font-semibold text-green-600">{conversionRate}</span>
          </p>
        )}
      </div>
    );
  }

  return null;
};

// Custom Label component to display value and conversion rate
const CustomBarLabel: React.FC<any> = (props) => {
  const { x, y, width, height, value, previousValue } = props;
  
  // Calculate conversion rate from the previous stage
  let conversionRateText = '';
  if (previousValue) {
    const conversionRate = ((value / previousValue) * 100).toFixed(1) + '%';
    conversionRateText = `(${conversionRate})`;
  }

  // Position the label to the right of the bar
  return (
    <g>
      <text 
        x={x + width + 5} 
        y={y + height / 2 + 5} 
        fill={SEVENSA_SECONDARY} 
        textAnchor="start" 
        className="text-xs font-semibold"
      >
        {value.toLocaleString()} {conversionRateText}
      </text>
    </g>
  );
};

// The main component
const FunnelChart: React.FC<FunnelChartProps> = ({ data, title, className = '' }) => {
  
  // 3. Pre-process data for the centered bar chart (funnel simulation)
  // We use a stacked bar chart with an invisible bar on the left to center the main bar.
  const processedData = useMemo(() => {
    let previousValue = 0;
    const max = data.reduce((acc, item) => Math.max(acc, item.value), 0);

    return data.map((item) => {
      const invisibleBar = (max - item.value) / 2;
      const result = {
        ...item,
        invisible: invisibleBar,
        previousValue: previousValue, // Store previous value for conversion rate calculation
      };
      previousValue = item.value;
      return result;
    });
  }, [data]);

  // 4. Define colors for the funnel stages
  const colors = [
    SEVENSA_PRIMARY,
    '#4DB8A9', // Lighter shade of primary
    '#80D1C6', // Even lighter shade
    '#B3E9E0', // Lightest shade
    '#E6FBF8', // Almost white
  ];

  return (
    <div className={`p-4 bg-white rounded-lg shadow-md ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">{title}</h3>
      )}
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={processedData}
            margin={{ top: 20, right: 80, left: 20, bottom: 5 }}
            barCategoryGap="10%" // Adjust gap to make bars look more like a funnel
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            
            {/* YAxis for the stage names */}
            <YAxis 
              dataKey="name" 
              type="category" 
              stroke={SEVENSA_SECONDARY}
              tickLine={false}
              axisLine={false}
            />
            
            {/* XAxis is hidden as values are implied by bar length */}
            <XAxis 
              type="number" 
              hide 
              domain={[0, processedData[0]?.invisible * 2 + processedData[0]?.value || 100]}
            />
            
            {/* Interactive Tooltip */}
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }} />
            
            {/* Invisible Bar for centering */}
            <Bar dataKey="invisible" stackId="a" fill="transparent" isAnimationActive={false} />
            
            {/* Main Funnel Bar */}
            <Bar dataKey="value" stackId="a" minPointSize={5}>
              {processedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.fillColor || colors[index % colors.length]} 
                />
              ))}
              
              {/* Custom Label to display value and conversion rate */}
              <LabelList 
                dataKey="value" 
                position="right" 
                content={<CustomBarLabel />}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FunnelChart;