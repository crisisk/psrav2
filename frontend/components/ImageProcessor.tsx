'use client';
import { useState, useRef } from 'react';

type ProcessedImage = {
  imageBuffer: string;
  width: number;
  height: number;
  format: string;
  size: number;
};

export default function ImageProcessor() {
  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileInputRef.current?.files?.[0]) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', fileInputRef.current.files[0]);

      const response = await fetch('/api/image-processing', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process image');
      }

      const data: ProcessedImage = await response.json();
      setProcessedImage(data);
    } catch (err) {
      console.error('Processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-control">
          <label className="label cursor-pointer">
            <span className="label-text">Select image (JPEG/PNG, max 5MB)</span>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="file-input file-input-bordered"
              disabled={isLoading}
            />
          </label>
        </div>

        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Optimize Image'}
        </button>

        {error && (
          <div className="alert alert-error mt-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
      </form>

      {processedImage && (
        <div className="mt-8 p-4 bg-base-200 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Optimized Image</h2>
          <div className="grid gap-4">
            <img
              src={`data:image/webp;base64,${processedImage.imageBuffer}`}
              alt="Optimized result"
              className="rounded-lg shadow-lg max-w-full h-auto"
            />
            <div className="stats shadow">
              <div className="stat">
                <div className="stat-title">Dimensions</div>
                <div className="stat-value">{processedImage.width}x{processedImage.height}</div>
              </div>
              <div className="stat">
                <div className="stat-title">Format</div>
                <div className="stat-value text-secondary">{processedImage.format}</div>
              </div>
              <div className="stat">
                <div className="stat-title">Size</div>
                <div className="stat-value">{(processedImage.size / 1024).toFixed(1)} KB</div>
              </div>
            </div>
            <a
              href={`data:image/webp;base64,${processedImage.imageBuffer}`}
              download="optimized-image.webp"
              className="btn btn-success w-full"
            >
              Download Optimized Image
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
