import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// --- Types ---

type Direction = 'left' | 'right' | 'top' | 'bottom';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  direction?: Direction;
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  size?: string; // e.g., 'w-80', 'h-1/3'
}

// --- Utility Functions ---

const getDirectionClasses = (direction: Direction, size: string = 'w-80'): {
  panelClasses: string;
  translateClasses: { enter: string; leave: string };
  sizeClasses: string;
} => {
  let panelClasses = '';
  let translateClasses = { enter: '', leave: '' };
  let sizeClasses = '';

  switch (direction) {
    case 'left':
      panelClasses = 'inset-y-0 left-0';
      translateClasses = { enter: 'translate-x-0', leave: '-translate-x-full' };
      sizeClasses = size?.startsWith('w-') ? size : 'w-80';
      break;
    case 'right':
      panelClasses = 'inset-y-0 right-0';
      translateClasses = { enter: 'translate-x-0', leave: 'translate-x-full' };
      sizeClasses = size?.startsWith('w-') ? size : 'w-80';
      break;
    case 'top':
      panelClasses = 'inset-x-0 top-0';
      translateClasses = { enter: 'translate-y-0', leave: '-translate-y-full' };
      sizeClasses = size?.startsWith('h-') ? size : 'h-1/3';
      break;
    case 'bottom':
      panelClasses = 'inset-x-0 bottom-0';
      translateClasses = { enter: 'translate-y-0', leave: 'translate-y-full' };
      sizeClasses = size?.startsWith('h-') ? size : 'h-1/3';
      break;
  }

  return { panelClasses, translateClasses, sizeClasses };
};

// --- Component ---

const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  direction = 'right',
  children,
  className = '',
  overlayClassName = '',
  size,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const { panelClasses, translateClasses, sizeClasses } = getDirectionClasses(direction, size);

  // State to control the transition animation
  const [isTransitioning, setIsTransitioning] = useState(false);
  // State to control the actual mounting/unmounting
  const [isMounted, setIsMounted] = useState(false);

  // Effect to handle mounting and unmounting with transitions
  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      // Start transition after a short delay to ensure mount
      const timer = setTimeout(() => setIsTransitioning(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsTransitioning(false);
      // Unmount after transition duration (300ms)
      const timer = setTimeout(() => setIsMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close on Escape key press
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

    // Ref to store the element that had focus before the drawer opened
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  // Effect for keyboard and focus management (only runs when mounted)
  useEffect(() => {
    if (isMounted) {
      // 1. Store the element that was focused before the drawer opened
      previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;

      // 2. Add Escape key listener
      document.addEventListener('keydown', handleKeyDown);

      // 3. Focus the drawer container on open
      const timeoutId = setTimeout(() => {
        // Try to focus the first focusable element, otherwise focus the container
        const focusableElements = drawerRef.current?.querySelectorAll(
          'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
        ) as NodeListOf<HTMLElement>;
        
        if (focusableElements && focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          drawerRef.current?.focus();
        }
      }, 50);

      // 4. Focus Trapping (handle Tab key)
      const handleTabKey = (event: KeyboardEvent) => {
        if (event.key !== 'Tab' || !drawerRef.current) return;

        const focusableElements = drawerRef.current.querySelectorAll(
          'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
        ) as NodeListOf<HTMLElement>;
        
        if (focusableElements.length === 0) {
          event.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          // Shift + Tab: focus moves backward
          if (document.activeElement === firstElement || document.activeElement === drawerRef.current) {
            lastElement.focus();
            event.preventDefault();
          }
        } else {
          // Tab: focus moves forward
          if (document.activeElement === lastElement) {
            firstElement.focus();
            event.preventDefault();
          }
        }
      };

      document.addEventListener('keydown', handleTabKey);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keydown', handleTabKey);
        clearTimeout(timeoutId);
        
        // 5. Restore focus on unmount
        if (previouslyFocusedElementRef.current && previouslyFocusedElementRef.current !== document.body) {
          previouslyFocusedElementRef.current.focus();
        }
      };
    }
  }, [isMounted, handleKeyDown]);

  if (!isMounted) {
    return null;
  }

  // Overlay
  const overlayClasses = `fixed inset-0 z-40 transition-opacity duration-300 
    ${isTransitioning ? 'opacity-100' : 'opacity-0'} 
    bg-gray-900/50 ${overlayClassName}`; // Sevensa branding: subtle dark overlay

  // Drawer Panel
  const drawerPanelClasses = `fixed z-50 flex flex-col shadow-2xl bg-white 
    transition-transform duration-300 ease-in-out transform 
    ${panelClasses} ${sizeClasses} ${className}
    ${isTransitioning ? translateClasses.enter : translateClasses.leave}`;

  const drawerContent = (
    <div className="fixed inset-0 overflow-hidden">
      {/* Overlay */}
      <div
        className={overlayClasses}
        onClick={onClose}
        aria-hidden="true"
        // Only allow clicks on the overlay if the drawer is fully open (or transitioning out)
        // This prevents accidental clicks during the brief period before unmount
        style={{ pointerEvents: isTransitioning ? 'auto' : 'none' }}
      />

      {/* Drawer Container */}
      <div
        ref={drawerRef}
        className={drawerPanelClasses}
        tabIndex={0} // Make it focusable to trap focus if no other elements are present
        role="dialog"
        aria-modal="true"
        aria-label="Drawer Panel" // Will be replaced with a more descriptive label in a real app
      >
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
        
        {/* Close Button (Sevensa branding: simple, clean close button) */}
        <button
          type="button"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          onClick={onClose}
          aria-label="Close drawer"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
};

export default Drawer;