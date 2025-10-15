'use client';

import { useState } from 'react';

export default function S3FileUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [fileUrl, setFileUrl] = useState<string>('');

  const handleUpload = async () => {
    if (!file) return;

    setStatus('uploading');

    try {
      // Get presigned URL
      const presignedResponse = await fetch(
        `/api/s3/upload?fileName=${encodeURIComponent(file.name)}&fileType=${file.type}`
      );

      if (!presignedResponse.ok) {
        throw new Error('Failed to get presigned URL');
      }

      const { url } = await presignedResponse.json();

      // Upload file directly to S3
      const uploadResponse = await fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      setStatus('success');
      setFileUrl(`/api/s3/${encodeURIComponent(file.name)}`);
    } catch (error) {
      console.error('Upload error:', error);
      setStatus('error');
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg max-w-md">
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      
      <button
        onClick={handleUpload}
        disabled={status === 'uploading' || !file}
        className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
      >
        {status === 'uploading' ? 'Uploading...' : 'Upload File'}
      </button>

      {status === 'success' && (
        <div className="text-green-600">
          File uploaded successfully!{' '}
          <a
            href={fileUrl}
            className="underline hover:text-green-700"
            target="_blank"
            rel="noopener noreferrer"
          >
            View file
          </a>
        </div>
      )}

      {status === 'error' && (
        <div className="text-red-600">
          Error uploading file. Please try again.
        </div>
      )}
    </div>
  );
}
