'use client';

import { useState, useEffect } from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

type NotificationProps = {
  message: string;
  urgency: 'low' | 'medium' | 'high';
  onDismiss?: () => void;
};

export function Notification({ message, urgency, onDismiss }: NotificationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!visible) return null;

  const urgencyStyles = {
    low: 'bg-blue-50 border-blue-400 text-blue-700',
    medium: 'bg-yellow-50 border-yellow-400 text-yellow-700',
    high: 'bg-red-50 border-red-400 text-red-700'
  };

  const UrgencyIcon = {
    low: InformationCircleIcon,
    medium: ExclamationTriangleIcon,
    high: CheckCircleIcon
  }[urgency];

  return (
    <div className={`p-4 mb-4 border-l-4 rounded-md ${urgencyStyles[urgency]}`} role="alert">
      <div className="flex items-center">
        <UrgencyIcon className="w-5 h-5 mr-3" />
        <span className="sr-only">{urgency} priority</span>
        <p className="text-sm font-medium">{message}</p>
        {onDismiss && (
          <button
            onClick={() => {
              setVisible(false);
              onDismiss();
            }}
            className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex items-center justify-center h-8 w-8 hover:opacity-75 focus:ring-2 focus:ring-offset-2"
            aria-label="Close"
          >
            <span className="sr-only">Close</span>
            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
