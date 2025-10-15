import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

type FileUploadResponse = {
  success: boolean;
  message: string;
  file?: {
    name: string;
    size: number;
    path: string;
  };
};

export default function FileUploadArea() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setUploadError('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false
  });

  const handleSubmit = async () => {
    if (!file) return;

    setIsLoading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData
      });

      const result: FileUploadResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'File upload failed');
      }

      // Reset after successful upload
      setFile(null);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}
          ${uploadError ? 'border-red-500 bg-red-50' : ''}`}
      >
        <input {...getInputProps()} />
        <p className="text-gray-600">
          {isDragActive
            ? 'Drop the file here...'
            : file
            ? file.name
            : 'Drag & drop compliance document here, or click to select'}
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Supported formats: PDF, DOC, DOCX (max 5MB)
        </p>
      </div>

      {file && (
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700
            disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Uploading...' : 'Submit Document'}
        </button>
      )}

      {uploadError && (
        <p className="text-red-600 text-sm mt-2">{uploadError}</p>
      )}
    </div>
  );
}
