'use client';

import { useParams } from 'next/navigation';

export default function DocumentationDetailsPage() {
  const params = useParams();

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">[systemid] Details</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Viewing [systemId]: {JSON.stringify(params)}</p>
      </div>
    </div>
  );
}
