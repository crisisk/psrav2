import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

// Sevensa Branding Colors
const SEVENSA_PRIMARY = '#00A896'; // Teal/Green for positive
const SEVENSA_SECONDARY = '#2D3A45'; // Dark Gray/Blue for text and background elements

/**
 * Props for the ComparisonCard component.
 */
interface ComparisonCardProps {
  /** The main title of the comparison card. */
  title: string;
  /** The primary value (e.g., current period). */
  primaryValue: number | string;
  /** The secondary value (e.g., previous period). */
  secondaryValue: number | string;
  /** The numerical difference between the primary and secondary value. */
  difference: number;
  /** The unit for the values (e.g., '$', '%'). */
  unit?: string;
  /** Optional description or context for the comparison. */
  description?: string;
}

/**
 * A side-by-side comparison card with two values and a difference indicator.
 * Uses Tailwind CSS for styling, Lucide icons, and Framer Motion for subtle animations.
 */
const ComparisonCard: React.FC<ComparisonCardProps> = ({
  title,
  primaryValue,
  secondaryValue,
  difference,
  unit = '',
  description,
}) => {
  // Determine the trend and corresponding color/icon
  const isPositive = difference > 0;
  const isNegative = difference < 0;
  // const isNeutral = difference === 0; // Not strictly needed, but kept for clarity

  const diffColor = isPositive
    ? SEVENSA_PRIMARY // Sevensa Primary for positive
    : isNegative
    ? '#EF4444' // Red for negative (standard Tailwind red-500)
    : SEVENSA_SECONDARY; // Sevensa Secondary for neutral

  const Icon = isPositive ? ArrowUp : isNegative ? ArrowDown : Minus;
  // Format difference to two decimal places and prepend '+' if positive
  const formattedDifference = `${isPositive ? '+' : ''}${difference.toFixed(2)}${unit}`;

  // Framer Motion variants for the difference indicator animation
  const indicatorVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <div
      className="p-6 rounded-xl shadow-lg border"
      style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }} // White background, light gray border
    >
      {/* Title */}
      <h3
        className="text-lg font-semibold mb-4"
        style={{ color: SEVENSA_SECONDARY }}
      >
        {title}
      </h3>

      <div className="flex justify-between items-center space-x-4">
        {/* Primary Value */}
        <div className="flex-1">
          <p className="text-3xl font-bold" style={{ color: SEVENSA_SECONDARY }}>
            {primaryValue}
            {unit}
          </p>
          <p className="text-sm text-gray-500 mt-1">Primary</p>
        </div>

        {/* Separator - Hidden on small screens */}
        <div className="h-12 w-px bg-gray-300 hidden sm:block" />

        {/* Secondary Value */}
        <div className="flex-1 text-right">
          <p className="text-xl font-medium text-gray-600">
            {secondaryValue}
            {unit}
          </p>
          <p className="text-sm text-gray-500 mt-1">Comparison</p>
        </div>
      </div>

      {/* Difference Indicator (Animated) */}
      <motion.div
        className="mt-6 pt-4 border-t flex items-center justify-between"
        style={{ borderColor: '#E5E7EB' }}
        initial="initial"
        animate="animate"
        variants={indicatorVariants}
        transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
      >
        <div className="flex items-center space-x-2">
          <Icon size={20} style={{ color: diffColor }} />
          <span className="text-lg font-semibold" style={{ color: diffColor }}>
            {formattedDifference}
          </span>
        </div>
        
        {/* Description - Visible on medium/large screens */}
        {description && (
          <p className="text-sm text-gray-500 hidden sm:block">{description}</p>
        )}
      </motion.div>
      
      {/* Responsive Description - Visible on small screens, centered */}
      {description && (
        <p className="text-sm text-gray-500 mt-2 sm:hidden text-center">{description}</p>
      )}
    </div>
  );
};

export default ComparisonCard;