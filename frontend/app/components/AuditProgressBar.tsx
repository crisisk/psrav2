'use client';

import { useEffect, useState } from 'react';

type ProgressBarProps = {
  percentage: number;
};

export const AuditProgressBar = ({ percentage }: ProgressBarProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Ensure percentage stays within 0-100 bounds
    const clampedPercentage = Math.min(Math.max(percentage, 0), 100);
    setProgress(clampedPercentage);
  }, [percentage]);

  return (
    <div className="w-full bg-gray-200 rounded-full h-4 dark:bg-gray-700">
      <div
        className="bg-blue-600 h-4 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
      >
        <span className="sr-only">{progress}% Complete</span>
      </div>
    </div>
  );
};
