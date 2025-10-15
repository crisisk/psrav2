import React from 'react';

// Define the custom colors for Sevensa branding
const SEVENSA_GREEN = '#00A896';
const SEVENSA_DARK = '#2D3A45';

/**
 * Props for the ProgressBar component.
 * @typedef {object} ProgressBarProps
 * @property {number} value - The current progress value (0 to 100).
 * @property {number} [max=100] - The maximum progress value. Defaults to 100.
 * @property {string} [label] - An optional label for the progress bar, used for accessibility.
 * @property {string} [className] - Optional Tailwind CSS classes to apply to the outer container.
 */
export interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  className?: string;
}

/**
 * A production-ready, accessible, and responsive progress bar component.
 * It uses Sevensa branding colors and Tailwind CSS for styling.
 *
 * @param {ProgressBarProps} props - The component props.
 * @returns {JSX.Element} The ProgressBar component.
 */
const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label = 'Loading progress',
  className = '',
}) => {
  // Ensure value is within the valid range [0, max]
  const normalizedValue = Math.min(Math.max(0, value), max);
  const percentage = Math.round((normalizedValue / max) * 100);

  return (
    <div
      className={`w-full h-2.5 rounded-full overflow-hidden ${className}`}
      style={{ backgroundColor: SEVENSA_DARK }}
      role="progressbar"
      aria-valuenow={normalizedValue}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
    >
      <div
        className="h-full transition-all duration-500 ease-out"
        style={{
          width: `${percentage}%`,
          backgroundColor: SEVENSA_GREEN,
        }}
      />
    </div>
  );
};

export default ProgressBar;
