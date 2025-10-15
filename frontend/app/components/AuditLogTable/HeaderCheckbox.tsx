'use client';
import { forwardRef, useCallback } from 'react';

interface HeaderCheckboxProps {
  isAllSelected: boolean;
  onSelectAll: (selected: boolean) => void;
}

export const HeaderCheckbox = forwardRef<HTMLInputElement, HeaderCheckboxProps>(
  ({ isAllSelected, onSelectAll }, ref) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onSelectAll(e.target.checked);
      },
      [onSelectAll]
    );

    return (
      <input
        type="checkbox"
        ref={ref}
        checked={isAllSelected}
        onChange={handleChange}
        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
        aria-label="Select all logs"
      />
    );
  }
);

HeaderCheckbox.displayName = 'HeaderCheckbox';
