"use client";

import { useEffect, useState } from 'react';

interface DocumentationItem {
  id: string;
  title: string;
  category: string;
  status: 'draft' | 'review' | 'published' | 'archived';
  lastUpdated: string;
  content: string;
}

interface ApiResponse {
  success: boolean;
  data?: DocumentationItem[];
  error?: string;
}

export default function DocumentationList() {
  const [docs, setDocs] = useState<DocumentationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDocumentation = async () => {
      try {
        const response = await fetch('/api/documentation');
        const data: ApiResponse = await response.json();

        if (!data.success || !data.data) {
          throw new Error(data.error || 'Failed to fetch documentation');
        }

        setDocs(data.data);
        setError(null);
      } catch (err) {
        console.error('Documentation fetch error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDocumentation();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-600">
        Loading documentation...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">
        Conformity Assessment Documentation
      </h1>

      <div className="space-y-4">
        {docs.map((doc) => (
          <div
            key={doc.id}
            className="bg-white rounded-lg shadow-sm p-4 border border-gray-200"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-gray-800">{doc.title}</h3>
              <span
                className={`px-3 py-1 rounded-full text-sm ${getStatusColor(doc.status)}`}
              >
                {doc.status}
              </span>
            </div>
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Category:</span> {doc.category}
            </div>
            <div className="text-sm text-gray-500">
              Last updated: {new Date(doc.lastUpdated).toLocaleDateString()}
            </div>
            <p className="mt-2 text-gray-700 text-sm">{doc.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
