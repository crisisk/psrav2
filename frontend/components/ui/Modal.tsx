import React, { useCallback, useEffect, useRef } from 'react';

// Define the Sevensa colors using Tailwind's arbitrary value notation for clarity
// Primary: #00A896 (A vibrant teal/green)
// Secondary/Dark: #2D3A45 (A dark slate/charcoal)

interface ModalProps {
  /** Controls the visibility of the modal. */
  isOpen: boolean;
  /** Function to call when the modal should be closed (e.g., on button click, overlay click, or escape key press). */
  onClose: () => void;
  /** The content to be displayed inside the modal. */
  children: React.ReactNode;
  /** Optional title for the modal, used for accessibility and display. */
  title?: string;
}

/**
 * A production-ready, accessible, and responsive Modal component.
 * It includes an overlay, a close button, and handles closing via the Escape key.
 * Uses Tailwind CSS for styling and Sevensa branding colors.
 */
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title = 'Modal Dialog' }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Function to handle closing the modal on Escape key press
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && isOpen) {
      onClose();
    }
  }, [isOpen, onClose]);

  // Effect to manage the keydown listener and focus trapping
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Set focus to the modal container when it opens for accessibility
      // Use a timeout to ensure the modal is rendered before attempting to focus
      const timeoutId = setTimeout(() => {
        modalRef.current?.focus();
      }, 0);

      // Prevent scrolling on the body when the modal is open
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        clearTimeout(timeoutId);
        document.body.style.overflow = 'unset';
      };
    }
    // Cleanup body overflow if modal closes
    document.body.style.overflow = 'unset';
    return () => {};
  }, [isOpen, handleKeyDown]);

  if (!isOpen) {
    return null;
  }

  return (
    // Modal Overlay (Fixed position, full screen, dark background)
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
      onClick={onClose} // Close on overlay click
    >
      {/* Modal Container (The actual dialog box) */}
      <div
        ref={modalRef}
        // Prevent closing when clicking inside the modal content
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1} // Make the container focusable
        className="relative w-full max-w-lg rounded-lg shadow-2xl transition-all duration-300 ease-out
                   bg-white dark:bg-[#2D3A45]
                   transform scale-100 opacity-100
                   sm:max-w-xl md:max-w-2xl lg:max-w-3xl" // Responsive sizing
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full text-[#2D3A45] hover:text-white
                     bg-transparent hover:bg-[#00A896] transition-colors duration-150 ease-in-out
                     focus:outline-none focus:ring-2 focus:ring-[#00A896] focus:ring-offset-2"
          aria-label="Close dialog"
        >
          {/* Simple X icon using SVG */}
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header (Hidden title for accessibility) */}
        <h2 id="modal-title" className="sr-only">
          {title}
        </h2>

        {/* Modal Content Area */}
        <div className="p-6">
          {children}
        </div>

        {/* Optional: Example Footer for demonstration/styling */}
        {/* <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#2D3A45] border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-white bg-[#00A896] rounded-md hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-[#00A896]"
          >
            Confirm
          </button>
        </div> */}
      </div>
    </div>
  );
};

export default Modal;