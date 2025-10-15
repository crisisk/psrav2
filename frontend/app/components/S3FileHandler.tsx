'use client';

import { useState, useCallback } from 'react';
import { z } from 'zod';

interface UploadResponse {
  url: string;
  fields: Record<string, string>;
}

interface DownloadResponse {
  url: string;
}

export default function S3FileHandler() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleUpload = useCallback(async (file: File) => {
    try {
      setLoading(true);
      setError(null);

      // Get presigned POST URL
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { url, fields } = (await res.json()) as UploadResponse;

      // Upload file directly to S3
      const formData = new FormData();
      Object.entries({ ...fields, file }).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const uploadResponse = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      return fields.key;
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDownload = useCallback(async (key: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/download/${encodeURIComponent(key)}`);
      if (!res.ok) {
        throw new Error('Failed to get download URL');
      }

      const { url } = (await res.json()) as DownloadResponse;
      setDownloadUrl(url);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Download error:', err);
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded-lg shadow-md">
      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium text-gray-700">
          Upload File
          <input
            type="file"
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            disabled={loading}
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          />
        </label>
      </div>

      {error && (
        <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      {downloadUrl && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            File ready for download
          </p>
        </div>
      )}
    </div>
  );
}
