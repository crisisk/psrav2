import React from 'react';

// Define the available sizes for the spinner
type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

// Define the available colors for the spinner, mapping to Sevensa branding
type SpinnerColor = 'primary' | 'secondary';

// Define the props for the Spinner component
interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The size of the spinner. Can be a predefined size ('sm', 'md', 'lg', 'xl') or a custom number (in pixels).
   * 'sm': 16px, 'md': 24px, 'lg': 32px, 'xl': 48px
   * @default 'md'
   */
  size?: SpinnerSize | number;
  /**
   * The color of the spinner, based on Sevensa branding.
   * 'primary': #00A896, 'secondary': #2D3A45
   * @default 'primary'
   */
  color?: SpinnerColor;
  /**
   * Additional class names to apply to the spinner container.
   */
  className?: string;
}

// Utility function to get the Tailwind size class based on the size prop
const getSizeClass = (size: SpinnerSize | number): string => {
  if (typeof size === 'number') {
    return `w-[${size}px] h-[${size}px] border-[${Math.max(2, Math.round(size / 12))}px]`;
  }

  switch (size) {
    case 'sm':
      return 'w-4 h-4 border-2'; // 16px
    case 'lg':
      return 'w-8 h-8 border-4'; // 32px
    case 'xl':
      return 'w-12 h-12 border-4'; // 48px
    case 'md':
    default:
      return 'w-6 h-6 border-3'; // 24px, using border-3 for better visual weight
  }
};

// Utility function to get the Tailwind color class based on the color prop
const getColorClass = (color: SpinnerColor): string => {
  // Sevensa Branding Colors:
  // Primary: #00A896 (A vibrant teal/cyan)
  // Secondary: #2D3A45 (A dark slate/charcoal)

  // We use arbitrary value classes for the specific hex codes to ensure branding consistency
  switch (color) {
    case 'secondary':
      return 'border-[#2D3A45] border-t-transparent';
    case 'primary':
    default:
      return 'border-[#00A896] border-t-transparent';
  }
};

/**
 * A production-ready, accessible, and responsive loading spinner component.
 * It uses Tailwind CSS for styling and Sevensa branding colors.
 */
const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'primary',
  className = '',
  ...rest
}) => {
  const sizeClass = getSizeClass(size);
  const colorClass = getColorClass(color);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading content"
      className={`
        inline-block
        rounded-full
        animate-spin
        ${sizeClass}
        ${colorClass}
        ${className}
      `}
      {...rest}
    >
      {/* Visually hidden text for screen readers, as aria-label is sufficient */}
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;