'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type StatusFilterProps = {
  initialStatus?: string;
};

export const statusOptions = [
  { value: 'ALL', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'TRIAL', label: 'Trial' },
  { value: 'CHURNED', label: 'Churned' },
] as const;

export type StatusOption = typeof statusOptions[number]['value'];

export function StatusFilter({ initialStatus = 'ALL' }: StatusFilterProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState(initialStatus);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = event.target.value;
    setSelectedStatus(newStatus);
    router.push(`/audit-logs?status=${newStatus}`);
  };

  // Sync with URL parameters on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const statusParam = params.get('status') || 'ALL';
    setSelectedStatus(statusParam);
  }, []);

  return (
    <select
      value={selectedStatus}
      onChange={handleChange}
      className="rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {statusOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
