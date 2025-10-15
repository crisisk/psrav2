'use client';
import { useEffect, useState } from 'react';

type Partner = {
  id: string;
  name: string;
  email: string;
  website: string;
};

export default function PartnerPortal() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newPartner, setNewPartner] = useState({ name: '', email: '', website: '' });

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const response = await fetch('/api/partners');
        if (!response.ok) throw new Error('Failed to fetch');
        const { data } = await response.json();
        setPartners(data);
      } catch (err) {
        setError('Failed to load partners');
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch('/api/partners', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (!response.ok) throw new Error('Deletion failed');
      setPartners(partners.filter(partner => partner.id !== id));
    } catch (err) {
      setError('Failed to delete partner');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPartner)
      });

      if (!response.ok) throw new Error('Creation failed');
      const { data } = await response.json();
      setPartners([...partners, data]);
      setNewPartner({ name: '', email: '', website: '' });
    } catch (err) {
      setError('Failed to create partner');
    }
  };

  if (loading) return <div className="p-4 text-gray-600">Loading...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Partner Portal</h1>
      
      <form onSubmit={handleSubmit} className="mb-8 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Name"
            className="p-2 border rounded"
            value={newPartner.name}
            onChange={e => setNewPartner({ ...newPartner, name: e.target.value })}
          />
          <input
            type="email"
            placeholder="Email"
            className="p-2 border rounded"
            value={newPartner.email}
            onChange={e => setNewPartner({ ...newPartner, email: e.target.value })}
          />
          <input
            type="url"
            placeholder="Website"
            className="p-2 border rounded"
            value={newPartner.website}
            onChange={e => setNewPartner({ ...newPartner, website: e.target.value })}
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Partner
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Website</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {partners.map(partner => (
              <tr key={partner.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-700">{partner.name}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{partner.email}</td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  <a href={partner.website} className="text-blue-600 hover:underline">
                    {partner.website}
                  </a>
                </td>
                <td className="px-6 py-4 text-sm">
                  <button
                    onClick={() => handleDelete(partner.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
