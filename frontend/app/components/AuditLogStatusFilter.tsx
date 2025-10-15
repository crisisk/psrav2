'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const statusOptions = [
  { value: 'all', label: 'All' },
  { value: 'success', label: 'Success' },
  { value: 'failure', label: 'Failure' },
  { value: 'pending', label: 'Pending' },
];

export default function AuditLogStatusFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleStatusChange = (status: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    
    if (status === 'all') {
      newParams.delete('status');
    } else {
      newParams.set('status', status);
    }

    router.replace(`?${newParams.toString()}`, { scroll: false });
  };

  return (
    <select
      value={searchParams.get('status') || 'all'}
      onChange={(e) => handleStatusChange(e.target.value)}
      className="rounded-md border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-700"
    >
      {statusOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
