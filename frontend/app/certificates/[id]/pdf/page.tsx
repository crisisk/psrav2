'use client';

import { useParams } from 'next/navigation';

export default function PdfPage() {
  const params = useParams();

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Pdf Details</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">Viewing pdf: {JSON.stringify(params)}</p>
      </div>
    </div>
  );
}
