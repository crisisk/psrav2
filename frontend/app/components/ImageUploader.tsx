'use client';
import { useCallback, useState } from 'react';

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export default function ImageUploader() {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [uploadedPath, setUploadedPath] = useState<string>('');

  const handleUpload = useCallback(async (file: File) => {
    setStatus('uploading');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Upload failed');
      }

      setUploadedPath(data.path);
      setStatus('success');
    } catch (error) {
      console.error('Upload error:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to upload image');
    }
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="space-y-4">
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center
          ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
          ${status === 'uploading' ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
        `}
      >
        <input
          type="file"
          id="file-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={status === 'uploading'}
        />
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="text-gray-600">
            <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-gray-500">
            PNG, JPG up to 5MB
          </p>
        </div>
      </div>

      {status === 'error' && (
        <p className="text-red-600 text-sm">{errorMessage}</p>
      )}

      {status === 'success' && (
        <div className="text-green-600 text-sm">
          Upload successful! Preview:
          <img
            src={uploadedPath}
            alt="Uploaded content"
            className="mt-2 max-h-48 object-contain rounded"
          />
        </div>
      )}

      {status === 'uploading' && (
        <p className="text-gray-600 text-sm">Uploading...</p>
      )}
    </div>
  );
}
