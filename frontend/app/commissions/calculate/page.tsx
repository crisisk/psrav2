'use client';

import { useEffect, useState } from 'react';

export default function CalculatePage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/calculate')
      .then(res => res.json())
      .then(data => {
        setData(Array.isArray(data) ? data : data.data || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Calculate</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <tbody>
            {data.map((item, idx) => (
              <tr key={idx} className="border-b">
                <td className="p-4">{JSON.stringify(item).slice(0, 100)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
