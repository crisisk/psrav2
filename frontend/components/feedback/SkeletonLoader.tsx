import React from 'react';

// Define the available shapes for the skeleton loader
type SkeletonShape = 'circle' | 'rectangle' | 'text';

// Define the props for the SkeletonLoader component
interface SkeletonLoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The shape of the skeleton loader.
   * 'circle' for a circular loader (e.g., for avatars).
   * 'rectangle' for a standard block (e.g., for images or cards).
   * 'text' for a line of text (e.g., for headings or paragraphs).
   */
  shape?: SkeletonShape;
  /**
   * The width of the skeleton loader. Required for 'rectangle' and 'text' shapes.
   * Can be any valid Tailwind width class (e.g., 'w-full', 'w-32').
   */
  width?: string;
  /**
   * The height of the skeleton loader. Required for 'rectangle' and 'circle' shapes.
   * Can be any valid Tailwind height class (e.g., 'h-8', 'h-16').
   */
  height?: string;
  /**
   * The number of text lines to display when shape is 'text'.
   * Defaults to 1.
   */
  lines?: number;
}

/**
 * A production-ready Skeleton Loader component with a pulse animation.
 * Adheres to Sevensa branding (clean, professional look) and accessibility standards.
 */
const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  shape = 'rectangle',
  width,
  height,
  lines = 1,
  className = '',
  ...rest
}) => {
  // Base classes for the skeleton item
  const baseClasses = 'bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse';

  // --- Accessibility ---
  // The component should convey its purpose to screen readers.
  // 'aria-live="polite"' ensures screen readers announce content changes when loading is complete.
  // 'aria-busy="true"' indicates that the section is being updated.

  const getShapeClasses = () => {
    switch (shape) {
      case 'circle':
        if (!height) {
          console.warn("SkeletonLoader: 'height' prop is recommended for 'circle' shape.");
        }
        // For a circle, we ensure it's square and fully rounded
        // Note: The logic for calculating width from height string is simplified and assumes 'h-X' format.
        // In a real-world scenario, you might want to enforce a specific height or use a fixed size.
        const size = height || 'h-10';
        return `${size} ${size.replace('h-', 'w-')} rounded-full`;
      case 'rectangle':
        // Standard block shape
        return `${width || 'w-full'} ${height || 'h-10'}`;
      case 'text':
        // Text line shape. We handle multiple lines separately.
        return `${width || 'w-full'} ${height || 'h-4'} rounded-sm`;
      default:
        return '';
    }
  };

  if (shape === 'text') {
    // Render multiple text lines
    const textLines = Array.from({ length: lines }, (_, index) => {
      // For text lines, vary the width of the last line for a more natural look
      const lineClasses = index === lines - 1 && lines > 1
        ? 'w-3/4' // Last line is shorter
        : width || 'w-full';

      return (
        <div
          key={index}
          className={`${baseClasses} ${lineClasses} ${height || 'h-4'} rounded-sm mb-2`}
          // Delay the animation slightly for a smoother, staggered effect
          style={{ animationDelay: `${index * 0.05}s` }}
        />
      );
    });

    return (
      <div
        className={`flex flex-col ${className}`}
        role="status"
        aria-live="polite"
        aria-busy="true"
        {...rest}
      >
        {textLines}
        <span className="sr-only">Loading content...</span>
      </div>
    );
  }

  // Render single shape (circle or rectangle)
  return (
    <div
      className={`${baseClasses} ${getShapeClasses()} ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      {...rest}
    >
      <span className="sr-only">Loading content...</span>
    </div>
  );
};

export default SkeletonLoader;