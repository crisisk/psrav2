'use client';

import { useState } from 'react';
import { Code, Book, Key } from 'lucide-react';

export default function ApiDocsPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState('assessments');

  const endpoints = [
    {
      id: 'assessments',
      method: 'POST',
      path: '/api/assessments/create',
      description: 'Create a new origin assessment',
    },
    {
      id: 'ltsd',
      method: 'POST',
      path: '/api/ltsd/generate',
      description: 'Generate LTSD certificate',
    },
    {
      id: 'export',
      method: 'POST',
      path: '/api/assessments/[id]/export',
      description: 'Export assessment data',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">API Documentation</h1>
        <p className="text-lg text-gray-600">
          Complete API reference for integrating with Sevensa PSRA-LTSD.
        </p>
      </div>

      {/* Authentication */}
      <section className="mb-8 bg-white dark:bg-dark-bg-surface rounded-lg p-6 shadow-sm">
        <div className="flex items-center mb-4">
          <Key className="h-5 w-5 mr-2 text-sevensa-teal" />
          <h2 className="text-2xl font-semibold">Authentication</h2>
        </div>
        <p className="mb-4">
          All API requests require authentication using Bearer tokens. Include your API key in the Authorization header:
        </p>
        <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
          <code>Authorization: Bearer YOUR_API_KEY</code>
        </pre>
      </section>

      {/* Endpoints */}
      <section className="mb-8">
        <div className="flex items-center mb-4">
          <Book className="h-5 w-5 mr-2 text-sevensa-teal" />
          <h2 className="text-2xl font-semibold">Endpoints</h2>
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <nav className="space-y-2">
              {endpoints.map((endpoint) => (
                <button
                  key={endpoint.id}
                  onClick={() => setSelectedEndpoint(endpoint.id)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    selectedEndpoint === endpoint.id
                      ? 'bg-sevensa-teal text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xs font-mono">{endpoint.method}</span>
                  <div className="text-sm">{endpoint.path.split('/').pop()}</div>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="md:col-span-3 bg-white dark:bg-dark-bg-surface rounded-lg p-6 shadow-sm">
            {endpoints
              .filter((e) => e.id === selectedEndpoint)
              .map((endpoint) => (
                <div key={endpoint.id}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-mono rounded">
                      {endpoint.method}
                    </span>
                    <code className="text-sm">{endpoint.path}</code>
                  </div>

                  <p className="mb-6">{endpoint.description}</p>

                  <h3 className="font-semibold mb-2">Request Example</h3>
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto mb-6">
                    <code>{`{
  "productName": "Example Product",
  "hsCode": "8471.30",
  "agreement": "EU-Japan"
}`}</code>
                  </pre>

                  <h3 className="font-semibold mb-2">Response Example</h3>
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                    <code>{`{
  "id": "assessment-123",
  "status": "created",
  "result": "QUALIFYING"
}`}</code>
                  </pre>
                </div>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}
