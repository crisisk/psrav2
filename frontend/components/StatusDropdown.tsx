'use client';

import { useEffect, useState } from 'react';

type StatusOption = {
  value: string;
  label: string;
};

type StatusDropdownProps = {
  onStatusChange: (status: string) => void;
};

export default function StatusDropdown({ onStatusChange }: StatusDropdownProps) {
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    const fetchStatusOptions = async () => {
      try {
        const response = await fetch('/api/conformity-statuses');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { data } = await response.json();
        setStatusOptions(data);
      } catch (error) {
        console.error('Error fetching status options:', error);
      }
    };

    fetchStatusOptions();
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedStatus(value);
    onStatusChange(value);
  };

  return (
    <div className="w-full max-w-xs">
      <select
        id="status-filter"
        value={selectedStatus}
        onChange={handleChange}
        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
