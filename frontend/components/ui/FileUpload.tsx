import React, { useState, useCallback, useRef, useMemo } from 'react';
import { CloudUpload, X, CheckCircle, AlertTriangle, Loader } from 'lucide-react';

// --- Types and Interfaces ---

/** Sevensa Branding Colors */
const SEVENSA_PRIMARY = '#00A896';
const SEVENSA_DARK = '#2D3A45';

type FileStatus = 'idle' | 'uploading' | 'success' | 'error';

interface UploadedFile {
  id: string;
  file: File;
  status: FileStatus;
  progress: number; // 0 to 100
  message: string;
}

interface FileUploadProps {
  /** Accepted file types (e.g., 'image/*', '.pdf'). Defaults to all. */
  accept?: string;
  /** Maximum number of files allowed. Defaults to 1. */
  maxFiles?: number;
  /** Callback when files are successfully uploaded (mocked). */
  onUploadSuccess?: (files: File[]) => void;
  /** Callback when an upload error occurs. */
  onUploadError?: (error: string) => void;
}

// --- Utility Functions ---

/** Generates a unique ID for a file */
const generateId = () => Math.random().toString(36).substring(2, 9);

/** Formats file size into a human-readable string */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// --- Mock Upload Function ---

/**
 * Simulates a file upload process with progress updates.
 * @param file The file to upload.
 * @param onProgress Callback for progress updates.
 * @returns A promise that resolves on success or rejects on error.
 */
const mockUpload = (
  file: File,
  onProgress: (progress: number) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 10) + 5; // Increment by 5-15%
      if (progress >= 100) {
        progress = 100;
        onProgress(100);
        clearInterval(interval);

        // Simulate random success/failure
        if (Math.random() > 0.1) { // 90% success rate
          setTimeout(resolve, 500);
        } else {
          setTimeout(() => reject(new Error('Server rejected the file.')), 500);
        }
      } else {
        onProgress(progress);
      }
    }, 300);
  });
};

// --- Component: FileUpload ---

const FileUpload: React.FC<FileUploadProps> = ({
  accept = '*',
  maxFiles = 1,
  onUploadSuccess,
  onUploadError,
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Handlers ---

  const handleFileChange = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Filter out files that exceed maxFiles limit
    const newFiles = Array.from(files).slice(0, maxFiles - uploadedFiles.length);

    if (newFiles.length === 0) {
      // Handle max files limit reached
      return;
    }

    const initialFiles: UploadedFile[] = newFiles.map(file => ({
      id: generateId(),
      file,
      status: 'idle',
      progress: 0,
      message: 'Ready to upload',
    }));

    setUploadedFiles(prev => [...prev, ...initialFiles]);
    initialFiles.forEach(file => startUpload(file));
  };

  const startUpload = useCallback((fileToUpload: UploadedFile) => {
    setUploadedFiles(prev =>
      prev.map(f =>
        f.id === fileToUpload.id ? { ...f, status: 'uploading', message: 'Uploading...' } : f
      )
    );

    const onProgress = (progress: number) => {
      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === fileToUpload.id ? { ...f, progress } : f
        )
      );
    };

    mockUpload(fileToUpload.file, onProgress)
      .then(() => {
        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === fileToUpload.id
              ? { ...f, status: 'success', progress: 100, message: 'Upload successful' }
              : f
          )
        );
        onUploadSuccess?.([fileToUpload.file]);
      })
      .catch((error: Error) => {
        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === fileToUpload.id
              ? { ...f, status: 'error', message: error.message || 'Upload failed' }
              : f
          )
        );
        onUploadError?.(error.message || 'Upload failed');
      });
  }, [onUploadSuccess, onUploadError]);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if the mouse leaves the entire drop zone
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  }, [maxFiles, uploadedFiles.length]);

  const handleRemoveFile = useCallback((id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  }, []);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  // --- Render Helpers ---

  const getStatusIcon = (status: FileStatus) => {
    switch (status) {
      case 'uploading':
        return <Loader className="w-5 h-5 animate-spin text-white" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-white" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-white" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: FileStatus) => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-500';
      case 'success':
        // Tailwind JIT mode does not support dynamic colors from variables like SEVENSA_PRIMARY
        // The color is applied via inline style in the JSX for the progress bar and icon background
        return 'bg-green-500'; 
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const dropzoneClasses = useMemo(() => {
    // Note: Tailwind JIT does not support arbitrary values in class names like `border-[${SEVENSA_PRIMARY}]`
    // We use a safe approach by applying the color via inline style or using a pre-defined Tailwind color.
    // For this component, we will rely on inline styles for the custom colors where necessary.
    const base = `flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-colors duration-200 cursor-pointer`;
    const active = isDragging
      ? `border-gray-500 bg-gray-50/50` // Use a safe color for drag state
      : `border-gray-300 hover:border-gray-500 hover:bg-gray-50`;
    return `${base} ${active}`;
  }, [isDragging]);

  // --- Component Structure ---

  return (
    <div className="w-full max-w-xl mx-auto font-sans">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={maxFiles > 1}
        accept={accept}
        onChange={(e) => handleFileChange(e.target.files)}
        className="hidden"
        aria-hidden="true"
      />

      {/* Dropzone Area */}
      <div
        className={dropzoneClasses}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleButtonClick}
        role="button"
        tabIndex={0}
        aria-label="Drag and drop files here or click to select files"
        aria-live="polite"
        style={{ borderColor: isDragging ? SEVENSA_PRIMARY : undefined }} // Apply custom color via style
      >
        <CloudUpload className="w-10 h-10 mb-3" style={{ color: SEVENSA_PRIMARY }} />
        <p className="text-lg font-semibold text-center" style={{ color: SEVENSA_DARK }}>
          {isDragging ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          or <span className="font-medium" style={{ color: SEVENSA_PRIMARY }}>click to browse</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {maxFiles > 1 ? `Up to ${maxFiles} files` : 'Single file upload'} ({accept === '*' ? 'Any file type' : accept})
        </p>
      </div>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6 space-y-3" role="list">
          <h3 className="text-sm font-medium" style={{ color: SEVENSA_DARK }}>
            {uploadedFiles.length} File{uploadedFiles.length > 1 ? 's' : ''} Selected
          </h3>
          {uploadedFiles.map((item) => (
            <div
              key={item.id}
              className="flex items-center p-3 rounded-lg shadow-sm border"
              role="listitem"
              aria-describedby={`file-status-${item.id}`}
            >
              {/* File Icon/Name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: SEVENSA_DARK }}>
                  {item.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(item.file.size)}
                </p>
              </div>

              {/* Progress Bar and Status */}
              <div className="w-40 mx-4">
                <div className="h-2 rounded-full overflow-hidden bg-gray-200" role="progressbar" aria-valuenow={item.progress} aria-valuemin={0} aria-valuemax={100}>
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${item.progress}%`,
                      backgroundColor: item.status === 'success' ? SEVENSA_PRIMARY : (item.status === 'error' ? 'red' : (item.status === 'uploading' ? 'blue' : 'gray')),
                    }}
                  />
                </div>
                <p id={`file-status-${item.id}`} className="text-xs mt-1 text-right" style={{ color: item.status === 'error' ? 'red' : SEVENSA_DARK }}>
                  {item.status === 'uploading' ? `${item.progress}%` : item.message}
                </p>
              </div>

              {/* Status Icon */}
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full ml-2 flex-shrink-0`}
                style={{ backgroundColor: item.status === 'success' ? SEVENSA_PRIMARY : getStatusColor(item.status) }}
                aria-label={`Upload status: ${item.status}`}
              >
                {getStatusIcon(item.status)}
              </div>

              {/* Remove Button */}
              {(item.status === 'idle' || item.status === 'error' || item.status === 'success') && (
                <button
                  onClick={() => handleRemoveFile(item.id)}
                  className="ml-3 p-1 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                  aria-label={`Remove file ${item.file.name}`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;