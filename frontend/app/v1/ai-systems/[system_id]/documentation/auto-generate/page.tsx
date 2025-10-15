'use client';

import { useParams } from 'next/navigation';

export default function AutoGeneratePage() {
  const params = useParams();

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Auto-generate Details</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Viewing auto-generate: {JSON.stringify(params)}</p>
      </div>
    </div>
  );
}
