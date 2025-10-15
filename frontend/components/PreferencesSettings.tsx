'use client';

import { useEffect, useState } from 'react';
import { UserPreferences } from '@/lib/types/user-preferences';

export default function PreferencesSettings() {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch('/api/preferences');
        if (!response.ok) throw new Error('Failed to load');
        const data = await response.json();
        setPreferences(data);
      } catch (error) {
        setMessage('Error loading preferences');
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preferences) return;

    try {
      const response = await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });

      if (!response.ok) throw new Error('Update failed');
      setMessage('Preferences saved successfully!');
    } catch (error) {
      setMessage('Error saving preferences');
    }
  };

  if (loading) return <div className="p-4 text-gray-600">Loading...</div>;

  return (
    <div className="max-w-md p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Display Preferences</h2>
      
      {message && (
        <div className={`mb-4 p-2 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Page Size:
            <input
              type="number"
              value={preferences?.pageSize || 20}
              onChange={(e) => setPreferences(prev => ({ ...prev!, pageSize: Number(e.target.value) }))}
              className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2"
              min="5"
              max="100"
            />
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Theme:
            <select
              value={preferences?.theme || 'light'}
              onChange={(e) => setPreferences(prev => ({ ...prev!, theme: e.target.value as 'light' | 'dark' }))}
              className="mt-1 block w-full rounded border-gray-300 shadow-sm p-2"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
        >
          Save Preferences
        </button>
      </form>
    </div>
  );
}
