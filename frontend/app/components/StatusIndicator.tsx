// Component to display status with teal styling and icons
'use client';

import { ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

type Status = 'pending' | 'approved' | 'rejected';

interface StatusIndicatorProps {
  status: Status;
  className?: string;
}

export const StatusIndicator = ({ status, className }: StatusIndicatorProps) => {
  const statusConfig = {
    pending: {
      icon: ClockIcon,
      bgColor: 'bg-teal-100',
      textColor: 'text-teal-800',
      label: 'Pending'
    },
    approved: {
      icon: CheckCircleIcon,
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      label: 'Approved'
    },
    rejected: {
      icon: XCircleIcon,
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      label: 'Rejected'
    }
  };

  const { icon: Icon, bgColor, textColor, label } = statusConfig[status];

  return (
    <div className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full', bgColor, className)}>
      <Icon className={cn('h-4 w-4', textColor)} aria-hidden="true" />
      <span className={cn('text-sm font-medium', textColor)}>{label}</span>
    </div>
  );
};
