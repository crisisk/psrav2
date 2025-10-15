'use client';

import { useState } from 'react';

interface DownloadFormProps {
  resourceId: string;
}

export default function AuditLogDownloadButton({ resourceId }: DownloadFormProps) {
  const [format, setFormat] = useState<'csv' | 'json'>('csv');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Programmatically submit form to trigger download
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/audit-logs/download';
    
    const dataInput = document.createElement('input');
    dataInput.type = 'hidden';
    dataInput.name = 'resourceId';
    dataInput.value = resourceId;

    const formatInput = document.createElement('input');
    formatInput.type = 'hidden';
    formatInput.name = 'format';
    formatInput.value = format;

    form.appendChild(dataInput);
    form.appendChild(formatInput);
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  };

  return (
    <form onSubmit={handleSubmit} className="inline-flex gap-3 items-center">
      <select
        value={format}
        onChange={(e) => setFormat(e.target.value as 'csv' | 'json')}
        className="px-3 py-2 border rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500"
      >
        <option value="csv">CSV</option>
        <option value="json">JSON</option>
      </select>

      <button
        type="submit"
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        Download Audit Log
      </button>
    </form>
  );
}
