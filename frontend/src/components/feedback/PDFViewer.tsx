import React, { useState, useCallback, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up PDF.js worker source
// NOTE: In a real-world application, you would host this file yourself or use a CDN.
// For this example, we use the default from the react-pdf package.
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

// --- Icons (Simplified for component generation) ---
// In a real project, these would be imported from a library like 'lucide-react' or 'heroicons'.
const ChevronLeft = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
);
const ChevronRight = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
);
const ZoomIn = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/></svg>
);
const ZoomOut = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="8" x2="14" y1="11" y2="11"/></svg>
);
const Download = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
);

// --- Types ---
interface PDFViewerProps {
  /** The URL or file data for the PDF document. */
  file: string | { data: ArrayBuffer | string };
  /** The filename to use for the download button. */
  filename?: string;
  /** Initial scale for the PDF viewer. Default is 1.0. */
  initialScale?: number;
  /** Optional class name for the main container. */
  className?: string;
}

// --- Constants ---
const MIN_SCALE = 0.5;
const MAX_SCALE = 3.0;
const SCALE_STEP = 0.25;
const SEVENSA_PRIMARY_COLOR = 'bg-blue-600 hover:bg-blue-700'; // Sevensa branding color
const SEVENSA_TEXT_COLOR = 'text-blue-600';

// --- Utility Component for Control Buttons ---
interface ControlButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
}

const ControlButton: React.FC<ControlButtonProps> = ({ icon, label, className, ...props }) => (
  <button
    className={`p-2 rounded-md transition-colors duration-200 ease-in-out ${className || 'text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'}`}
    aria-label={label}
    title={label}
    {...props}
  >
    {icon}
  </button>
);

// --- Main Component ---
const PDFViewer: React.FC<PDFViewerProps> = ({ file, filename = 'document.pdf', initialScale = 1.0, className }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(initialScale);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((err: Error) => {
    console.error('Error loading PDF document:', err);
    setError('Failed to load PDF document.');
    setLoading(false);
  }, []);

  const goToPrevPage = useCallback(() => {
    setPageNumber(prevPageNumber => Math.max(1, prevPageNumber - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber(prevPageNumber => Math.min(numPages || 1, prevPageNumber + 1));
  }, [numPages]);

  const zoomIn = useCallback(() => {
    setScale(prevScale => Math.min(MAX_SCALE, prevScale + SCALE_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prevScale => Math.max(MIN_SCALE, prevScale - SCALE_STEP));
  }, []);

  const handleDownload = useCallback(() => {
    if (typeof file === 'string') {
      // Simple case: file is a URL
      const link = document.createElement('a');
      link.href = file;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Complex case: file is ArrayBuffer/string data (requires more complex handling,
      // but for a production-ready component, we assume the file prop is a URL for simplicity
      // or the consumer handles the data download).
      // For this component, we'll focus on the URL download.
      console.warn('Data-based PDF download not implemented in this simplified example. Use a URL for the `file` prop.');
    }
  }, [file, filename]);

  const renderContent = useMemo(() => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          Loading PDF...
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full text-red-600 p-4">
          Error: {error}
        </div>
      );
    }

    return (
      <div className="flex justify-center p-4">
        <Document
          file={file}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          className="shadow-xl"
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderAnnotationLayer={true}
            renderTextLayer={true}
            className="transition-transform duration-300 ease-in-out"
          />
        </Document>
      </div>
    );
  }, [loading, error, file, pageNumber, scale, onDocumentLoadSuccess, onDocumentLoadError]);

  const controlBar = (
    <div
      className="flex justify-center items-center p-2 bg-white border-b border-gray-200 shadow-md sticky top-0 z-10"
      role="toolbar"
      aria-label="PDF Viewer Controls"
    >
      {/* Page Navigation Controls */}
      <div className="flex items-center space-x-1 mr-4">
        <ControlButton
          icon={<ChevronLeft className="w-5 h-5" />}
          label="Previous Page"
          onClick={goToPrevPage}
          disabled={pageNumber <= 1 || !numPages}
        />
        <span className="text-sm font-medium text-gray-700 mx-2" aria-live="polite">
          Page <span className={SEVENSA_TEXT_COLOR}>{pageNumber}</span> of {numPages || '-'}
        </span>
        <ControlButton
          icon={<ChevronRight className="w-5 h-5" />}
          label="Next Page"
          onClick={goToNextPage}
          disabled={pageNumber >= (numPages || 1) || !numPages}
        />
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center space-x-1 border-l border-gray-300 pl-4 mr-4">
        <ControlButton
          icon={<ZoomOut className="w-5 h-5" />}
          label="Zoom Out"
          onClick={zoomOut}
          disabled={scale <= MIN_SCALE}
        />
        <span className="text-sm font-medium text-gray-700 mx-2" aria-live="polite">
          {Math.round(scale * 100)}%
        </span>
        <ControlButton
          icon={<ZoomIn className="w-5 h-5" />}
          label="Zoom In"
          onClick={zoomIn}
          disabled={scale >= MAX_SCALE}
        />
      </div>

      {/* Download Button (Sevensa Branded) */}
      <div className="border-l border-gray-300 pl-4">
        <button
          className={`flex items-center px-4 py-2 text-white rounded-lg font-semibold transition-all duration-300 ease-in-out ${SEVENSA_PRIMARY_COLOR} shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
          onClick={handleDownload}
          disabled={!numPages}
          aria-label={`Download ${filename}`}
        >
          <Download className="w-5 h-5 mr-2" />
          Download
        </button>
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col h-full w-full overflow-hidden bg-gray-50 ${className}`} role="document">
      {controlBar}
      <div className="flex-grow overflow-auto" role="region" aria-label="PDF Document View">
        {renderContent}
      </div>
    </div>
  );
};

export default PDFViewer;