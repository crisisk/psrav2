/**
 * LineChart Component
 * Interactive line chart with Chart.js
 */

'use client'

import { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export interface LineChartDataset {
  label: string
  data: number[]
  borderColor?: string
  backgroundColor?: string
  fill?: boolean
  tension?: number
}

export interface LineChartProps {
  labels: string[]
  datasets: LineChartDataset[]
  title?: string
  height?: number
  showLegend?: boolean
  showGrid?: boolean
  stacked?: boolean
}

const LineChart: React.FC<LineChartProps> = ({
  labels,
  datasets,
  title,
  height = 300,
  showLegend = true,
  showGrid = true,
  stacked = false,
}) => {
  const chartRef = useRef(null)

  const defaultColors = [
    '#00A896', // Sevensa Teal
    '#2D3A45', // Sevensa Dark
    '#10B981', // Success
    '#F59E0B', // Warning
    '#EF4444', // Error
    '#3B82F6', // Info
  ]

  const processedDatasets = datasets.map((dataset, index) => ({
    ...dataset,
    borderColor: dataset.borderColor || defaultColors[index % defaultColors.length],
    backgroundColor: dataset.backgroundColor || `${defaultColors[index % defaultColors.length]}33`,
    fill: dataset.fill !== undefined ? dataset.fill : false,
    tension: dataset.tension !== undefined ? dataset.tension : 0.4,
    borderWidth: 3,
    pointRadius: 4,
    pointHoverRadius: 6,
    pointBackgroundColor: dataset.borderColor || defaultColors[index % defaultColors.length],
    pointBorderColor: '#fff',
    pointBorderWidth: 2,
  }))

  const data = {
    labels,
    datasets: processedDatasets,
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: showLegend,
        position: 'top' as const,
        labels: {
          font: {
            family: 'Montserrat',
            size: 12,
            weight: '600',
          },
          color: '#2D3A45',
          padding: 15,
          usePointStyle: true,
        },
      },
      title: {
        display: !!title,
        text: title,
        font: {
          family: 'Montserrat',
          size: 16,
          weight: '700',
        },
        color: '#2D3A45',
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: '#2D3A45',
        titleFont: {
          family: 'Montserrat',
          size: 14,
          weight: '700',
        },
        bodyFont: {
          family: 'Montserrat',
          size: 13,
        },
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || ''
            if (label) {
              label += ': '
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('nl-NL').format(context.parsed.y)
            }
            return label
          },
        },
      },
    },
    scales: {
      x: {
        stacked,
        grid: {
          display: showGrid,
          color: '#E5E7EB',
          drawBorder: false,
        },
        ticks: {
          font: {
            family: 'Montserrat',
            size: 11,
          },
          color: '#6B7280',
        },
      },
      y: {
        stacked,
        beginAtZero: true,
        grid: {
          display: showGrid,
          color: '#E5E7EB',
          drawBorder: false,
        },
        ticks: {
          font: {
            family: 'Montserrat',
            size: 11,
          },
          color: '#6B7280',
          callback: function (value) {
            return new Intl.NumberFormat('nl-NL').format(value as number)
          },
        },
      },
    },
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-6">
      <div style={{ height: `${height}px` }}>
        <Line ref={chartRef} data={data} options={options} />
      </div>
    </div>
  )
}

export default LineChart

