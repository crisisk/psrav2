'use client';

import { useEffect, useState } from 'react';

interface Partner {
  id: number;
  name: string;
  url: string;
  description?: string;
}

export default function PartnerLinks() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const response = await fetch('/api/partners');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPartners(data);
      } catch (err) {
        setError('Failed to load partner links. Please try again later.');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, []);

  if (loading) {
    return <div className="p-4 text-center text-gray-600">Loading partners...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Partner Links</h2>
      <div className="space-y-4">
        {partners.map((partner) => (
          <div
            key={partner.id}
            className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <a
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              {partner.name}
            </a>
            {partner.description && (
              <p className="mt-2 text-gray-600 text-sm">{partner.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
