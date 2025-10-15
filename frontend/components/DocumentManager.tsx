'use client';
import { useEffect, useState } from 'react';

type Document = {
  id: string;
  title: string;
  description?: string;
  uploadedAt: string;
  fileSize: number;
};

export default function DocumentManager() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Fetch documents on component mount
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setStatus('loading');
        const response = await fetch('/api/documents');
        
        if (!response.ok) throw new Error('Failed to fetch');
        
        const data = await response.json();
        setDocuments(data);
        setStatus('idle');
      } catch (error) {
        setStatus('error');
        setErrorMessage('Failed to load documents');
      }
    };

    fetchDocuments();
  }, []);

  // Handle file upload
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      setStatus('loading');
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.[0]?.message || 'Upload failed');
      }

      const newDocument = await response.json();
      setDocuments(prev => [...prev, newDocument]);
      setSelectedFile(null);
      setStatus('idle');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Document Management</h2>

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Title
            </label>
            <input
              name="title"
              type="text"
              required
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File
            </label>
            <input
              name="file"
              type="file"
              required
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>
      </form>

      {/* Status Messages */}
      {status === 'error' && (
        <div className="p-4 mb-4 text-red-700 bg-red-50 rounded-md">
          {errorMessage}
        </div>
      )}

      {/* Documents List */}
      <div className="space-y-4">
        {documents.map((doc) => (
          <div key={doc.id} className="p-4 border rounded-md hover:bg-gray-50">
            <h3 className="font-semibold text-lg text-gray-800">{doc.title}</h3>
            {doc.description && (
              <p className="text-gray-600 mt-1">{doc.description}</p>
            )}
            <div className="mt-2 text-sm text-gray-500">
              <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
              <span className="mx-2">•</span>
              <span>{(doc.fileSize / 1024).toFixed(2)} KB</span>
            </div>
          </div>
        ))}

        {documents.length === 0 && status === 'idle' && (
          <p className="text-gray-500 text-center py-8">No documents found</p>
        )}
      </div>
    </div>
  );
}
