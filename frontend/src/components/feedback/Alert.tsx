import React, { useState, useCallback, useEffect } from 'react';
import { X, Info, CheckCircle, AlertTriangle, AlertOctagon } from 'lucide-react';

// --- Type Definitions ---

/**
 * Defines the available visual variants for the Alert component.
 * Sevensa branding colors are mapped to these variants.
 */
export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

/**
 * Defines the props for the Alert component.
 */
export interface AlertProps {
  /** The visual style and color of the alert. */
  variant?: AlertVariant;
  /** The content of the alert. */
  children: React.ReactNode;
  /** Whether the alert can be closed by the user. */
  dismissible?: boolean;
  /** Optional title for the alert. */
  title?: string;
  /** Optional custom icon to override the default icon for the variant. */
  icon?: React.ReactNode;
  /** Optional callback function when the alert is dismissed. */
  onDismiss?: () => void;
  /** Optional class name for custom styling. */
  className?: string;
}

// --- Sevensa Branding Color Mapping (Tailwind Classes) ---

const variantStyles: Record<AlertVariant, {
  icon: React.ElementType;
  bg: string;
  text: string;
  border: string;
  dismissButton: string;
}> = {
  info: {
    icon: Info,
    bg: 'bg-blue-50', // Light blue for info
    text: 'text-blue-800',
    border: 'border-blue-400',
    dismissButton: 'text-blue-600 hover:text-blue-800',
  },
  success: {
    icon: CheckCircle,
    bg: 'bg-green-50', // Light green for success
    text: 'text-green-800',
    border: 'border-green-400',
    dismissButton: 'text-green-600 hover:text-green-800',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-yellow-50', // Light yellow for warning
    text: 'text-yellow-800',
    border: 'border-yellow-400',
    dismissButton: 'text-yellow-600 hover:text-yellow-800',
  },
  error: {
    icon: AlertOctagon,
    bg: 'bg-red-50', // Light red for error
    text: 'text-red-800',
    border: 'border-red-400',
    dismissButton: 'text-red-600 hover:text-red-800',
  },
};

// --- Component Implementation ---

const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  children,
  dismissible = false,
  title,
  icon,
  onDismiss,
  className = '',
}) => {
  const [show, setShow] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);
  const styles = variantStyles[variant];
  const IconComponent = icon ? () => <>{icon}</> : styles.icon;

  const handleDismiss = useCallback(() => {
    setShow(false);
  }, []);

  useEffect(() => {
    if (!show) {
      // Wait for the transition to finish before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
        if (onDismiss) {
          onDismiss();
        }
      }, 300); // Matches the transition duration
      return () => clearTimeout(timer);
    }
  }, [show, onDismiss]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div
      role="alert"
      className={`
        ${styles.bg} ${styles.text} ${styles.border}
        p-4 rounded-lg border-l-4 shadow-md
        flex items-start space-x-3
        transition-all duration-300 ease-in-out
        ${show ? 'opacity-100 max-h-40 py-4' : 'opacity-0 max-h-0 py-0 overflow-hidden'}
        ${className}
      `}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        <IconComponent className="w-5 h-5" aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className="text-sm font-semibold leading-5">
            {title}
          </h3>
        )}
        <div className={`text-sm ${title ? 'mt-1' : ''}`}>
          {children}
        </div>
      </div>

      {/* Dismiss Button */}
      {dismissible && (
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              className={`
                inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2
                ${styles.dismissButton} hover:bg-opacity-50
                focus:ring-offset-2 focus:ring-gray-600
              `}
              onClick={handleDismiss}
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alert;
