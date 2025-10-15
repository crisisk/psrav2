import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

// --- Types ---

interface Image {
  src: string;
  alt: string;
  thumbnailSrc?: string;
}

interface ImageGalleryProps {
  images: Image[];
  initialIndex?: number;
  /** Custom class name for the main gallery container */
  className?: string;
}

// --- Constants for Sevensa Branding ---

// Sevensa primary color for accents (e.g., focus rings, active states)
const SEVENSA_PRIMARY = 'text-indigo-600';
const SEVENSA_BG_ACCENT = 'bg-indigo-600';
const SEVENSA_HOVER_BG = 'hover:bg-indigo-700';
const SEVENSA_FOCUS_RING = 'focus:ring-indigo-500';

// --- Utility Components ---

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  className?: string;
}

const IconButton: React.FC<IconButtonProps> = ({ icon, label, className = '', ...props }) => (
  <button
    type="button"
    aria-label={label}
    className={`p-2 rounded-full transition-colors duration-200 ease-in-out ${className}`}
    {...props}
  >
    {icon}
  </button>
);

// --- Lightbox Component ---

interface LightboxProps {
  images: Image[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({ images, currentIndex, onClose, onNext, onPrev }) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset zoom and position when image changes
  useEffect(() => {
    setZoomLevel(1);
    setTranslate({ x: 0, y: 0 });
  }, [currentIndex]);

  const currentImage = images[currentIndex];

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 1));

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel === 1) return;
    setTranslate({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft') onPrev();
    if (e.key === 'ArrowRight') onNext();
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const imageStyle: React.CSSProperties = {
    transform: `scale(${zoomLevel}) translate(${translate.x / zoomLevel}px, ${translate.y / zoomLevel}px)`,
    cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
    transition: isDragging ? 'none' : 'transform 0.3s ease-in-out',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
      role="dialog"
      aria-modal="true"
      aria-label="Image Lightbox"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Close Button */}
      <IconButton
        icon={<X className="w-6 h-6 text-white" />}
        label="Close Lightbox"
        onClick={onClose}
        className="absolute top-4 right-4 z-50 bg-white/10 hover:bg-white/20"
      />

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <IconButton
            icon={<ChevronLeft className="w-8 h-8 text-white" />}
            label="Previous Image"
            onClick={onPrev}
            disabled={currentIndex === 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-white/10 hover:bg-white/20 disabled:opacity-50"
          />
          <IconButton
            icon={<ChevronRight className="w-8 h-8 text-white" />}
            label="Next Image"
            onClick={onNext}
            disabled={currentIndex === images.length - 1}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-white/10 hover:bg-white/20 disabled:opacity-50"
          />
        </>
      )}

      {/* Zoom Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex space-x-2 p-2 bg-black/50 rounded-full">
        <IconButton
          icon={<ZoomIn className="w-5 h-5 text-white" />}
          label="Zoom In"
          onClick={handleZoomIn}
          disabled={zoomLevel >= 3}
          className="bg-transparent hover:bg-white/20 disabled:opacity-50"
        />
        <IconButton
          icon={<ZoomOut className="w-5 h-5 text-white" />}
          label="Zoom Out"
          onClick={handleZoomOut}
          disabled={zoomLevel <= 1}
          className="bg-transparent hover:bg-white/20 disabled:opacity-50"
        />
      </div>

      {/* Image Container */}
      <div className="max-w-[90vw] max-h-[90vh] flex items-center justify-center overflow-hidden">
        <img
          ref={imageRef}
          src={currentImage.src}
          alt={currentImage.alt}
          className={`max-w-full max-h-full object-contain select-none ${isDragging ? 'cursor-grabbing' : ''}`}
          style={imageStyle}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          draggable="false"
        />
      </div>
    </div>
  );
};

// --- Main ImageGallery Component ---

const ImageGallery: React.FC<ImageGalleryProps> = ({ images, initialIndex = 0, className = '' }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const thumbnailRef = useRef<HTMLDivElement>(null);

  const totalImages = images.length;

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % totalImages);
  }, [totalImages]);

  const goToPrev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + totalImages) % totalImages);
  }, [totalImages]);

  const currentImage = useMemo(() => images[currentIndex], [images, currentIndex]);

  // Scroll active thumbnail into view
  useEffect(() => {
    if (thumbnailRef.current) {
      const activeThumbnail = thumbnailRef.current.children[currentIndex] as HTMLElement;
      if (activeThumbnail) {
        activeThumbnail.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [currentIndex]);

  // Accessibility: Keyboard navigation for main view
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isLightboxOpen) {
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === 'ArrowRight') goToNext();
    }
  }, [isLightboxOpen, goToPrev, goToNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Image Display */}
      <div className="relative group aspect-w-16 aspect-h-9 w-full overflow-hidden rounded-lg shadow-xl">
        <img
          src={currentImage.src}
          alt={currentImage.alt}
          className="w-full h-full object-cover transition-opacity duration-500 ease-in-out"
        />
        
        {/* Lightbox Trigger */}
        <button
          type="button"
          onClick={() => setIsLightboxOpen(true)}
          aria-label="View image in full screen"
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 focus:outline-none focus:ring-4 ${SEVENSA_FOCUS_RING} focus:ring-opacity-50"
        >
          <ZoomIn className="w-10 h-10 text-white" />
        </button>

        {/* Navigation Arrows for Main View */}
        {totalImages > 1 && (
          <>
            <IconButton
              icon={<ChevronLeft className="w-6 h-6 text-white" />}
              label="Previous Image"
              onClick={goToPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
            <IconButton
              icon={<ChevronRight className="w-6 h-6 text-white" />}
              label="Next Image"
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
          </>
        )}
      </div>

      {/* Thumbnails */}
      <div
        ref={thumbnailRef}
        className="flex space-x-3 overflow-x-auto p-1"
        role="tablist"
        aria-label="Image Thumbnails"
      >
        {images.map((image, index) => (
          <button
            key={index}
            role="tab"
            aria-selected={index === currentIndex}
            aria-controls={`gallery-image-${index}`}
            tabIndex={index === currentIndex ? 0 : -1}
            onClick={() => setCurrentIndex(index)}
            className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 ${SEVENSA_FOCUS_RING} ${
              index === currentIndex
                ? `border-${SEVENSA_PRIMARY.split('-')[1]}-600 ring-4 ${SEVENSA_FOCUS_RING}`
                : 'border-gray-200 hover:border-gray-400'
            }`}
          >
            <img
              src={image.thumbnailSrc || image.src}
              alt={`Thumbnail ${index + 1}: ${image.alt}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <Lightbox
          images={images}
          currentIndex={currentIndex}
          onClose={() => setIsLightboxOpen(false)}
          onNext={goToNext}
          onPrev={goToPrev}
        />
      )}
    </div>
  );
};

export default ImageGallery;