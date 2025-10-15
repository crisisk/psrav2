import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

// --- Sevensa Branding Colors ---
// Primary: #00A896 (Teal/Cyan)
// Secondary/Background: #2D3A45 (Dark Gray)
const SEVENSA_PRIMARY = '#00A896';
const SEVENSA_SECONDARY = '#2D3A45';

/**
 * Props for the MetricDisplay component.
 */
interface MetricDisplayProps {
  /** The main numerical value to display. */
  value: number;
  /** The unit or currency symbol for the value (e.g., '%', '$', 'users'). */
  unit: string;
  /** A descriptive subtitle for the metric (e.g., 'Total Revenue', 'Conversion Rate'). */
  subtitle: string;
  /** The current progress value (0 to 100). */
  progress: number;
  /** The label for the progress bar (e.g., 'Target Achieved'). */
  progressLabel: string;
  /** Optional icon to display next to the metric. */
  Icon?: LucideIcon;
  /** Optional color for the metric value and progress bar (defaults to Sevensa Primary). */
  color?: string;
  /** Optional boolean to indicate a positive trend for styling (e.g., green text). */
  isPositive?: boolean;
  /** Optional boolean to indicate a negative trend for styling (e.g., red text). */
  isNegative?: boolean;
}

/**
 * A large metric display component with unit, subtitle, and progress bar.
 * It uses Tailwind CSS for styling, Lucide icons, and Framer Motion for animations.
 */
const MetricDisplay: React.FC<MetricDisplayProps> = ({
  value,
  unit,
  subtitle,
  progress,
  progressLabel,
  Icon,
  color = SEVENSA_PRIMARY,
  isPositive = false,
  isNegative = false,
}) => {
  // Determine the color for the metric value and icon based on trend
  let metricColor = color;
  // Use standard Tailwind colors for trend indicators for better compatibility
  if (isPositive) {
    metricColor = '#10B981'; // Tailwind 'green-500'
  } else if (isNegative) {
    metricColor = '#EF4444'; // Tailwind 'red-500'
  }

  // Ensure progress is clamped between 0 and 100
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <motion.div
      // Responsive container with Sevensa dark background
      className="p-6 rounded-xl shadow-2xl w-full max-w-lg mx-auto transition-all duration-300"
      style={{ backgroundColor: SEVENSA_SECONDARY }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Subtitle and Icon */}
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium uppercase tracking-wider text-gray-400">
          {subtitle}
        </h3>
        {Icon && (
          <Icon className="w-6 h-6" style={{ color: metricColor }} />
        )}
      </div>

      {/* Metric Value */}
      <div className="flex items-baseline mb-4">
        <motion.p
          // Large, bold text for the main metric
          className="text-5xl sm:text-6xl font-extrabold"
          style={{ color: metricColor }}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 100, delay: 0.1 }}
        >
          {value.toLocaleString()}
        </motion.p>
        <span className="ml-2 text-xl sm:text-2xl font-semibold text-gray-300">
          {unit}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-xs font-medium mb-1">
          <span className="text-gray-400">{progressLabel}</span>
          <span style={{ color: metricColor }}>{clampedProgress}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2.5">
          <motion.div
            className="h-2.5 rounded-full"
            style={{ backgroundColor: metricColor }}
            initial={{ width: '0%' }}
            animate={{ width: `${clampedProgress}%` }}
            transition={{ duration: 1.0, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default MetricDisplay;