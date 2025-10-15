'use client';

import { useState, useCallback } from 'react';

type LeadFormData = {
  name: string;
  email: string;
  company: string;
  phone: string;
};

export default function RegisterLeadButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState<LeadFormData>({
    name: '',
    email: '',
    company: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register lead');
      }

      // Reset form and close modal on success
      setFormData({ name: '', email: '', company: '', phone: '' });
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200"
      >
        Register Lead
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-gray-500/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Register New Lead</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  required
                  className="w-full p-2 border rounded"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  required
                  className="w-full p-2 border rounded"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Company</label>
                <input
                  type="text"
                  required
                  className="w-full p-2 border rounded"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  required
                  className="w-full p-2 border rounded"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
