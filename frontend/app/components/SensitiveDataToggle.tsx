'use client';

import { useState } from 'react';

type SensitiveDataToggleProps = {
  value: string;
  maskChar?: string;
  maskLength?: number;
};

export const SensitiveDataToggle = ({
  value,
  maskChar = '•',
  maskLength = 4,
}: SensitiveDataToggleProps) => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => setIsVisible((prev) => !prev);

  const maskedValue = maskChar.repeat(
    Math.min(maskLength, value.length)
  );

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono">
        {isVisible ? value : maskedValue}
      </span>
      <button
        type="button"
        onClick={toggleVisibility}
        className="text-gray-400 hover:text-blue-500 transition-colors"
        aria-label={isVisible ? 'Mask sensitive data' : 'Reveal sensitive data'}
      >
        <svg
          className={`w-5 h-5 ${isVisible ? 'text-blue-500' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      </button>
    </div>
  );
};
