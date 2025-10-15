'use client';

import { useState, useRef } from 'react';
import { Assessment } from '@/lib/types';

export const AssessmentDropdown = ({ assessmentId }: { assessmentId: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleAction = async (action: 'delete' | 'edit') => {
    try {
      const endpoint = `/api/assessments/${assessmentId}`;

      if (action === 'delete') {
        const response = await fetch(endpoint, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete assessment');
        }
      }

      // Close dropdown after action
      setIsOpen(false);
    } catch (error) {
      console.error('Dropdown action failed:', error);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-full"
        aria-haspopup="true"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 12h.01M12 12h.01M19 12h.01"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          role="menu"
        >
          <div className="py-1">
            <button
              onClick={() => handleAction('edit')}
              className="block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
            >
              Edit Assessment
            </button>
            <button
              onClick={() => handleAction('delete')}
              className="block w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              role="menuitem"
            >
              Delete Assessment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
