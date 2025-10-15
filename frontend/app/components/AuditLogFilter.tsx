'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type StatusType = 'ALL' | 'PENDING' | 'PAID' | 'DISPUTED';

export default function AuditLogFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedStatus, setSelectedStatus] = useState<StatusType>(
    (searchParams.get('status') as StatusType) || 'ALL'
  );

  useEffect(() => {
    const newParams = new URLSearchParams(searchParams.toString());
    if (selectedStatus === 'ALL') {
      newParams.delete('status');
    } else {
      newParams.set('status', selectedStatus);
    }

    router.replace(`?${newParams.toString()}`, { scroll: false });
  }, [selectedStatus, router, searchParams]);

  return (
    <select
      value={selectedStatus}
      onChange={(e) => setSelectedStatus(e.target.value as StatusType)}
      className="px-4 py-2 border rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
    >
      {['ALL', 'PENDING', 'PAID', 'DISPUTED'].map((status) => (
        <option key={status} value={status}>
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </option>
      ))}
    </select>
  );
}
