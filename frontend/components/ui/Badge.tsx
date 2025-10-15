import React from 'react';

// Define the possible color variants for the badge
export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

// Define the props for the Badge component
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** The content of the badge. */
  children: React.ReactNode;
  /** The color variant of the badge, corresponding to a status. */
  variant?: BadgeVariant;
  /** Optional ARIA label for accessibility. */
  'aria-label'?: string;
}

/**
 * A production-ready Badge component for displaying status information.
 * Uses Tailwind CSS for styling and supports Sevensa branding colors.
 * 
 * NOTE: This component relies on a Tailwind CSS configuration that defines
 * the following custom colors based on Sevensa branding and standard status colors:
 * 
 * // Example Tailwind Config Snippet:
 * // ...
 * // colors: {
 * //   'sevensa-primary': '#00A896',
 * //   'sevensa-dark': '#2D3A45',
 * //   'status-success': { DEFAULT: '#00A896', light: '#E0F2F1', text: '#00695C' },
 * //   'status-warning': { DEFAULT: '#FFC107', light: '#FFF8E1', text: '#FF8F00' },
 * //   'status-error': { DEFAULT: '#F44336', light: '#FFEBEE', text: '#C62828' },
 * //   'status-info': { DEFAULT: '#2196F3', light: '#E3F2FD', text: '#1565C0' },
 * //   'status-default': { DEFAULT: '#2D3A45', light: '#EBEFF2', text: '#2D3A45' },
 * // }
 * // ...
 */
const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
  'aria-label': ariaLabel,
  ...rest
}) => {
  // Function to determine the Tailwind CSS classes based on the variant
  const getVariantClasses = (v: BadgeVariant): string => {
    switch (v) {
      case 'success':
        // Uses 'sevensa-primary' color for success
        return 'bg-status-success-light text-status-success-text';
      case 'warning':
        return 'bg-status-warning-light text-status-warning-text';
      case 'error':
        return 'bg-status-error-light text-status-error-text';
      case 'info':
        return 'bg-status-info-light text-status-info-text';
      case 'default':
      default:
        // Uses 'sevensa-dark' color for default
        return 'bg-status-default-light text-status-default-text';
    }
  };

  // Base styling for the badge
  const baseClasses =
    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-150 ease-in-out whitespace-nowrap';

  const variantClasses = getVariantClasses(variant);

  return (
    <span
      className={`${baseClasses} ${variantClasses} ${className}`}
      role="status"
      aria-label={ariaLabel || `${variant} status badge`}
      {...rest}
    >
      {children}
    </span>
  );
};

export default Badge;