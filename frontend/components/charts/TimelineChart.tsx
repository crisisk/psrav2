import React, { useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, TimeScale, ChartData, ChartOptions, ScriptableContext } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

// Sevensa Branding Colors
const PRIMARY_COLOR = '#00A896'; // Teal
const SECONDARY_COLOR = '#2D3A45'; // Dark Slate

// --- TypeScript Interfaces ---

/**
 * Defines a single task item for the timeline chart.
 * start and end should be ISO date strings (e.g., 'YYYY-MM-DD').
 */
export interface TimelineItem {
  id: string;
  task: string;
  start: string;
  end: string;
  group: string; // Used for grouping/coloring, e.g., 'Development', 'Design'
}

/**
 * Props for the TimelineChart component.
 */
export interface TimelineChartProps {
  data: TimelineItem[];
  title?: string;
}

// --- Utility Functions ---

/**
 * Maps the raw timeline data to Chart.js data format for a Gantt-style chart.
 * A Gantt bar is represented by two data points: [start, end].
 */
const mapDataToChartJS = (data: TimelineItem[]): ChartData<'bar', [number, number][], string> => {
  // 1. Get unique task names for the y-axis labels
  const labels = data.map(item => item.task);

  // 2. Map the start and end dates to the Chart.js data format.
  // The data for a horizontal bar chart is an array of [start_value, end_value].
  const chartData = data.map(item => [
    new Date(item.start).getTime(),
    new Date(item.end).getTime(),
  ] as [number, number]);

  // 3. Assign colors based on a simple group hash or index
  const uniqueGroups = Array.from(new Set(data.map(item => item.group)));
  const getColor = (group: string) => {
    const index = uniqueGroups.indexOf(group);
    return index % 2 === 0 ? PRIMARY_COLOR : SECONDARY_COLOR;
  };

  const backgroundColors = data.map(item => getColor(item.group));

  return {
    labels: labels,
    datasets: [
      {
        label: 'Task Duration',
        data: chartData,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map(color => color + 'AA'), // Slightly transparent border
        borderWidth: 1,
        // Set to 'x' to make it a horizontal bar chart
        // Chart.js v4+ uses indexAxis for orientation
        indexAxis: 'y' as const,
        barPercentage: 0.8,
        categoryPercentage: 0.9,
      },
    ],
  };
};

// --- Chart Options ---

const getChartOptions = (title: string): ChartOptions<'bar'> => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  plugins: {
    legend: {
      display: false, // Gantt charts typically don't need a legend for the bars themselves
    },
    title: {
      display: !!title,
      text: title,
      font: {
        size: 18,
        weight: 'bold',
      },
      color: SECONDARY_COLOR,
    },
    tooltip: {
      callbacks: {
        title: (tooltipItems) => {
          // The task name is the label
          return tooltipItems[0].label;
        },
        label: (context) => {
          const dataIndex = context.dataIndex;
          const dataset = context.dataset;
          const rawData = dataset.data[dataIndex] as [number, number];
          
          // Convert timestamps back to readable dates
          const startDate = new Date(rawData[0]).toLocaleDateString();
          const endDate = new Date(rawData[1]).toLocaleDateString();

          return `Duration: ${startDate} - ${endDate}`;
        },
        afterLabel: (context) => {
            const item = (context.chart.data as any).originalData[context.dataIndex] as TimelineItem;
            return `Group: ${item.group}`;
        }
      },
      backgroundColor: SECONDARY_COLOR,
      titleColor: PRIMARY_COLOR,
      bodyColor: '#FFFFFF',
      borderColor: PRIMARY_COLOR,
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      type: 'time' as const,
      time: {
        unit: 'day',
        tooltipFormat: 'MMM d, yyyy',
        displayFormats: {
          day: 'MMM d',
          week: 'MMM d',
        },
      },
      title: {
        display: true,
        text: 'Timeline',
        color: SECONDARY_COLOR,
      },
      grid: {
        color: 'rgba(45, 58, 69, 0.1)', // Light grid lines
      },
      ticks: {
        color: SECONDARY_COLOR,
      }
    },
    y: {
      // Category scale for the task names
      type: 'category' as const,
      title: {
        display: true,
        text: 'Tasks',
        color: SECONDARY_COLOR,
      },
      grid: {
        display: false, // Hide horizontal grid lines for cleaner look
      },
      ticks: {
        color: SECONDARY_COLOR,
      }
    },
  },
});

// --- Component ---

const TimelineChart: React.FC<TimelineChartProps> = ({ data, title = 'Project Timeline' }) => {
  // Use useMemo to prevent unnecessary recalculations of chart data and options
  const chartData = useMemo(() => {
    const mappedData = mapDataToChartJS(data);
    // Attach original data for use in custom tooltips
    (mappedData as any).originalData = data; 
    return mappedData;
  }, [data]);

  const options = useMemo(() => getChartOptions(title), [title]);

  // Tailwind CSS for responsive container
  return (
    <div className="w-full h-96 md:h-[500px] p-4 bg-white shadow-lg rounded-lg border border-gray-200">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default TimelineChart;

// --- Example Usage (for reference, not part of the component) ---
/*
const exampleData: TimelineItem[] = [
  { id: '1', task: 'Phase 1: Planning', start: '2025-10-01', end: '2025-10-05', group: 'Management' },
  { id: '2', task: 'Design Mockups', start: '2025-10-06', end: '2025-10-12', group: 'Design' },
  { id: '3', task: 'Frontend Setup', start: '2025-10-10', end: '2025-10-15', group: 'Development' },
  { id: '4', task: 'Backend API', start: '2025-10-16', end: '2025-10-25', group: 'Development' },
  { id: '5', task: 'Testing & QA', start: '2025-10-26', end: '2025-10-30', group: 'Management' },
];

function App() {
  return (
    <div className="p-8">
      <TimelineChart data={exampleData} title="Sevensa Project X Timeline" />
    </div>
  );
}
*/