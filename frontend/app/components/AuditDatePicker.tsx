'use client';

import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { addDays } from 'date-fns';
import 'react-datepicker/dist/react-datepicker.css';

type AuditLogResponse = {
  logs: Array<{
    id: string;
    timestamp: string;
    action: string;
  }>;
  error?: string;
};

export default function AuditDatePicker() {
  const [startDate, setStartDate] = useState<Date>(addDays(new Date(), -30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  // Fetch audit logs when dates change
  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const params = new URLSearchParams({
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        });

        const response = await fetch(`/api/audit-logs?${params}`);
        if (!response.ok) throw new Error('Failed to fetch logs');

        const data: AuditLogResponse = await response.json();
        if (data.error) throw new Error(data.error);

        // Handle log data - would typically pass to parent component
        console.log('Fetched logs:', data.logs);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load audit logs');
      }
    };

    fetchAuditLogs();
  }, [startDate, endDate]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">
          Date Range:
        </span>
        <DatePicker
          selectsRange
          startDate={startDate}
          endDate={endDate}
          onChange={(dates) => {
            const [start, end] = dates as [Date, Date];
            setStartDate(start);
            setEndDate(end);
          }}
          className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
          popperClassName="z-50"
          maxDate={new Date()}
          isClearable
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
