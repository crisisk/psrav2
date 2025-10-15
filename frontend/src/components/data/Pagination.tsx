import React, { useState, useMemo, useCallback, ChangeEvent, KeyboardEvent } from 'react';

// --- Types and Interfaces ---

interface PaginationProps {
  /** The current active page number (1-indexed). */
  currentPage: number;
  /** The total number of items across all pages. */
  totalItems: number;
  /** The number of items to display per page. */
  pageSize: number;
  /** An array of available page size options. */
  pageSizeOptions?: number[];
  /** Callback function when the page changes. */
  onPageChange: (page: number) => void;
  /** Callback function when the page size changes. */
  onPageSizeChange: (size: number) => void;
  /** The maximum number of page buttons to display (excluding first/last/prev/next). */
  pageButtonLimit?: number;
}

// --- Constants for Sevensa Branding (Modern, Professional Look) ---

// Note: Tailwind JIT/AOT compilation requires full class names. 
// Using string interpolation for dynamic classes like `bg-${SEVENSA_PRIMARY}` 
// is generally discouraged unless the classes are explicitly safelisted in the Tailwind config.
// For production readiness, we will use the full class names for the chosen colors.
// Assuming 'indigo-600', 'indigo-700', 'gray-700', 'gray-300', 'white' are available.

const SEVENSA_PRIMARY_BG = 'bg-indigo-600';
const SEVENSA_PRIMARY_HOVER_BG = 'hover:bg-indigo-700';
const SEVENSA_PRIMARY_RING = 'focus:ring-indigo-600';
const SEVENSA_TEXT = 'text-gray-700';
const SEVENSA_BORDER = 'border-gray-300';
const SEVENSA_BG = 'bg-white';

// --- Utility Function to Generate Page Numbers ---

const DOTS = '...';

const range = (start: number, end: number) => {
  const length = end - start + 1;
  return Array.from({ length }, (_, idx) => idx + start);
};

const usePagination = ({
  currentPage,
  totalPages,
  pageButtonLimit = 5,
}: {
  currentPage: number;
  totalPages: number;
  pageButtonLimit?: number;
}) => {
  return useMemo(() => {
    if (pageButtonLimit >= totalPages) {
      return range(1, totalPages);
    }

    // Calculate the number of pages to show around the current page
    const siblingCount = Math.floor(pageButtonLimit / 2);
    
    // Determine the start and end of the page range to display
    let startPage = Math.max(2, currentPage - siblingCount);
    let endPage = Math.min(totalPages - 1, currentPage + siblingCount);

    // Adjust start/end if they are too close to the edges
    const totalVisiblePages = endPage - startPage + 1;
    if (totalVisiblePages < pageButtonLimit) {
        const diff = pageButtonLimit - totalVisiblePages;
        if (startPage === 2) {
            endPage = Math.min(totalPages - 1, endPage + diff);
        } else if (endPage === totalPages - 1) {
            startPage = Math.max(2, startPage - diff);
        }
    }

    const showLeftDots = startPage > 2;
    const showRightDots = endPage < totalPages - 1;

    if (!showLeftDots && showRightDots) {
      const leftRange = range(1, endPage);
      return [...leftRange, DOTS, totalPages];
    }

    if (showLeftDots && !showRightDots) {
      const rightRange = range(startPage, totalPages);
      return [1, DOTS, ...rightRange];
    }

    if (showLeftDots && showRightDots) {
      const middleRange = range(startPage, endPage);
      return [1, DOTS, ...middleRange, DOTS, totalPages];
    }

    return range(1, totalPages);
  }, [currentPage, totalPages, pageButtonLimit]);
};

// --- Component Helpers ---

const PageButton: React.FC<{
  page: number | string;
  isActive: boolean;
  onClick: (page: number) => void;
  disabled: boolean;
}> = ({ page, isActive, onClick, disabled }) => {
  const isDots = page === DOTS;
  // Use full class names to avoid Tailwind JIT issues
  const baseClasses = `px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 ${SEVENSA_PRIMARY_RING} focus:ring-offset-2`;

  if (isDots) {
    return (
      <span className={`${baseClasses} ${SEVENSA_TEXT} cursor-default`} aria-hidden="true">
        {DOTS}
      </span>
    );
  }

  const pageNumber = page as number;
  const activeClasses = `${SEVENSA_PRIMARY_BG} text-white shadow-md`;
  const inactiveClasses = `${SEVENSA_TEXT} ${SEVENSA_BG} border ${SEVENSA_BORDER} hover:bg-gray-50`;
  const disabledClasses = 'opacity-50 cursor-not-allowed';

  return (
    <button
      type="button"
      onClick={() => onClick(pageNumber)}
      disabled={disabled}
      aria-current={isActive ? 'page' : undefined}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} ${disabled ? disabledClasses : ''}`}
    >
      {pageNumber}
    </button>
  );
};

// --- Main Component ---

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  pageButtonLimit = 5,
}) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginationRange = usePagination({ currentPage, totalPages, pageButtonLimit });

  const [jumpToPageInput, setJumpToPageInput] = useState<string>('');

  const handlePageChange = useCallback(
    (page: number) => {
      if (page > 0 && page <= totalPages) {
        onPageChange(page);
      }
    },
    [onPageChange, totalPages]
  );

  const handlePageSizeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const newSize = Number(event.target.value);
    onPageSizeChange(newSize);
  };

  const handleJumpToPageChange = (event: ChangeEvent<HTMLInputElement>) => {
    // Only allow digits in the input
    const value = event.target.value.replace(/[^0-9]/g, '');
    setJumpToPageInput(value);
  };

  const handleJumpToPageSubmit = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      const page = Number(jumpToPageInput);
      if (page > 0 && page <= totalPages) {
        handlePageChange(page);
        setJumpToPageInput(''); // Clear input on successful jump
      } else if (jumpToPageInput !== '') {
        // Clear input if invalid page number was entered
        setJumpToPageInput('');
      }
    }
  };

  if (totalPages <= 1) {
    return null; // Don't render if there's only one page or no items
  }

  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <nav
      className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white border-t border-gray-200"
      aria-label="Pagination"
    >
      {/* Left Section: Item Count and Page Size Selector */}
      <div className="flex items-center space-x-6 mb-4 sm:mb-0">
        {/* Item Count Display */}
        <p className={`text-sm ${SEVENSA_TEXT}`}>
          Showing <span className="font-semibold">{startItem}</span> to <span className="font-semibold">{endItem}</span> of{' '}
          <span className="font-semibold">{totalItems}</span> results
        </p>

        {/* Page Size Selector */}
        <div className="flex items-center space-x-2">
          <label htmlFor="pageSize" className={`text-sm ${SEVENSA_TEXT} whitespace-nowrap`}>
            Items per page:
          </label>
          <select
            id="pageSize"
            name="pageSize"
            value={pageSize}
            onChange={handlePageSizeChange}
            aria-label="Select items per page"
            className={`block w-full pl-3 pr-10 py-1.5 text-base ${SEVENSA_BORDER} focus:outline-none ${SEVENSA_PRIMARY_RING} focus:border-indigo-600 sm:text-sm rounded-md shadow-sm`}>
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right Section: Page Navigation and Jump-to-Page */}
      <div className="flex items-center space-x-4">
        {/* Page Navigation Buttons */}
        <div className="flex items-center space-x-1">
          {/* Previous Button */}
          <button
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={isFirstPage}
            aria-label="Previous Page"
            className={`p-2 border ${SEVENSA_BORDER} rounded-md ${SEVENSA_TEXT} hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 ${SEVENSA_PRIMARY_RING} focus:ring-offset-2`}>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L9.46 10l3.31 3.71a.75.75 0 11-1.08 1.04l-3.75-4.25a.75.75 0 010-1.04l3.75-4.25a.75.75 0 011.06-.02z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Page Number Buttons */}
          {paginationRange.map((page, index) => (
            <PageButton
              key={index}
              page={page}
              isActive={page === currentPage}
              onClick={handlePageChange}
              disabled={page === DOTS}
            />
          ))}

          {/* Next Button */}
          <button
            type="button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={isLastPage}
            aria-label="Next Page"
            className={`p-2 border ${SEVENSA_BORDER} rounded-md ${SEVENSA_TEXT} hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 ${SEVENSA_PRIMARY_RING} focus:ring-offset-2`}>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L10.54 10 7.23 6.29a.75.75 0 111.08-1.04l3.75 4.25a.75.75 0 010 1.04l-3.75 4.25a.75.75 0 01-1.06.02z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Jump-to-Page Input */}
        <div className="flex items-center space-x-2">
          <label htmlFor="jumpToPage" className={`text-sm ${SEVENSA_TEXT} whitespace-nowrap`}>
            Go to page:
          </label>
          <input
            id="jumpToPage"
            type="number"
            min="1"
            max={totalPages}
            value={jumpToPageInput}
            onChange={handleJumpToPageChange}
            onKeyDown={handleJumpToPageSubmit}
            placeholder={currentPage.toString()}
            aria-label={`Jump to page (1 to ${totalPages})`}
            className={`w-16 pl-3 pr-2 py-1.5 text-base ${SEVENSA_BORDER} focus:outline-none ${SEVENSA_PRIMARY_RING} focus:border-indigo-600 sm:text-sm rounded-md shadow-sm text-center`}>
          </input>
        </div>
      </div>
    </nav>
  );
};

export default Pagination;