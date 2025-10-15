'use client';

import { useParams } from 'next/navigation';

export default function DocumentsPage() {
  const params = useParams();

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Documents Details</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Viewing documents: {JSON.stringify(params)}</p>
      </div>
    </div>
  );
}
