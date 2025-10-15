import React, { useState, useEffect, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

// --- Types ---

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  /** The unique ID for the toast. Used for managing multiple toasts. */
  id: string;
  /** The type of the toast, which determines the icon and color scheme. */
  type: ToastType;
  /** The main message content of the toast. */
  message: string;
  /** Optional title for the toast. */
  title?: string;
  /** Duration in milliseconds before the toast automatically closes. Set to 0 for permanent. */
  duration?: number;
  /** Callback function to be called when the toast is closed (either by timeout or user action). */
  onClose: (id: string) => void;
}

// --- Constants & Helpers ---

// Sevensa Branding Colors: #00A896 (Primary/Success), #2D3A45 (Dark/Info/Default)
const TYPE_CONFIG = {
  success: {
    icon: CheckCircle,
    color: 'text-[#00A896]', // Sevensa Primary
    bg: 'bg-white',
    border: 'border-[#00A896]',
    ariaLive: 'assertive',
    role: 'status',
  },
  error: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-white',
    border: 'border-red-600',
    ariaLive: 'assertive',
    role: 'alert',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bg: 'bg-white',
    border: 'border-yellow-500',
    ariaLive: 'polite',
    role: 'status',
  },
  info: {
    icon: Info,
    color: 'text-[#2D3A45]', // Sevensa Dark
    bg: 'bg-white',
    border: 'border-[#2D3A45]',
    ariaLive: 'polite',
    role: 'status',
  },
};

// --- Component ---

/**
 * A production-ready, accessible, and responsive notification toast component.
 * Uses TypeScript, Tailwind CSS, and Sevensa branding colors.
 */
const Toast: React.FC<ToastProps> = ({
  id,
  type,
  message,
  title,
  duration = 5000,
  onClose,
}) => {
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  const handleClose = useCallback(() => {
    onClose(id);
  }, [id, onClose]);

  // Auto-close logic
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(handleClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, handleClose]);

  // Determine ARIA label for the close button
  const closeButtonLabel = `Close ${title || type} notification`;

  return (
    <div
      className={`
        flex items-start p-4 mb-4 w-full max-w-sm
        rounded-lg shadow-lg border-l-4
        transition-all duration-300 ease-out
        transform translate-x-0 opacity-100
        ${config.bg} ${config.border}
        hover:shadow-xl
      `}
      role={config.role}
      aria-live={config.ariaLive}
      aria-atomic="true"
    >
      {/* Icon */}
      <div className={`flex-shrink-0 ${config.color}`}>
        <Icon className="w-6 h-6" aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="ml-3 flex-1 pt-0.5">
        {title && (
          <p className="text-sm font-semibold text-[#2D3A45]">{title}</p>
        )}
        <p className="text-sm text-gray-700 mt-1">{message}</p>
      </div>

      {/* Close Button */}
      <div className="ml-4 flex-shrink-0 flex">
        <button
          type="button"
          className={`
            p-1 rounded-md inline-flex
            text-gray-400 hover:text-gray-500
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00A896]
          `}
          onClick={handleClose}
          aria-label={closeButtonLabel}
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
