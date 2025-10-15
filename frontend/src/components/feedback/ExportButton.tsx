import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, FileText, FileSpreadsheet, FileBarChart2, Download } from 'lucide-react';

// --- Types ---

type ExportFormat = 'excel' | 'pdf' | 'csv';

interface ExportButtonProps {
  /** The data to be exported. In a real application, this would be the array of objects. */
  data: any[];
  /** The base name for the exported file. */
  fileName: string;
  /** The available export formats. Defaults to all three. */
  formats?: ExportFormat[];
  /** Optional callback for when an export is initiated. */
  onExport?: (format: ExportFormat) => void;
}

// --- Constants ---

const formatLabels: Record<ExportFormat, { label: string; icon: React.ElementType }> = {
  excel: { label: 'Excel (.xlsx)', icon: FileSpreadsheet },
  pdf: { label: 'PDF (.pdf)', icon: FileText },
  csv: { label: 'CSV (.csv)', icon: FileBarChart2 },
};

// Sevensa Branding Interpretation:
// Primary Color: A deep, professional blue (e.g., #1e40af - blue-700)
// Accent Color: A vibrant, modern green (e.g., #10b981 - emerald-500)
// Focus/Hover: Subtle, clean transitions.

// --- Placeholder Export Logic (Phase 4) ---

const simulateExport = (format: ExportFormat, fileName: string) => {
  console.log(`Simulating export of "${fileName}" to ${format}...`);
  // In a real application, this would trigger the actual data processing and download.
  // For this component, we just simulate a brief loading state.
  return new Promise(resolve => setTimeout(resolve, 1500));
};

// --- Component ---

const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  fileName,
  formats = ['excel', 'pdf', 'csv'],
  onExport,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<ExportFormat | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on Escape key
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, []);

  // Handle export action
  const handleExport = useCallback(async (format: ExportFormat) => {
    if (isExporting) return;

    setIsOpen(false);
    setIsExporting(format);
    onExport?.(format);

    try {
      await simulateExport(format, fileName);
      // Success feedback could be added here
    } catch (error) {
      console.error('Export failed:', error);
      // Error feedback could be added here
    } finally {
      setIsExporting(null);
    }
  }, [fileName, isExporting, onExport]);

  // Tailwind CSS Classes (Sevensa Branding & Animations)
  const baseButtonClasses = `
    inline-flex items-center justify-center
    px-4 py-2 text-sm font-medium
    rounded-lg shadow-md
    transition-all duration-300 ease-in-out
    focus:outline-none focus:ring-4
    disabled:opacity-60 disabled:cursor-not-allowed
  `;

  const primaryButtonClasses = `
    bg-blue-700 text-white
    hover:bg-blue-800
    focus:ring-blue-300
  `;

  const menuContainerClasses = `
    absolute right-0 mt-2 w-56
    rounded-lg shadow-xl
    bg-white ring-1 ring-black ring-opacity-5
    transform origin-top-right
    transition-all duration-200 ease-out
    z-10
  `;

  const menuItemClasses = (format: ExportFormat) => `
    flex items-center w-full px-4 py-2 text-sm
    text-gray-700
    hover:bg-blue-50 hover:text-blue-700
    transition-colors duration-150 ease-in-out
    rounded-lg
    ${isExporting === format ? 'bg-blue-100 text-blue-700 font-semibold' : ''}
  `;

  const menuTransitionClasses = isOpen
    ? 'opacity-100 scale-100'
    : 'opacity-0 scale-95 pointer-events-none';

  const chevronRotation = isOpen ? 'rotate-180' : 'rotate-0';

  return (
    <div className="relative inline-block text-left">
      <div>
        <button
          ref={buttonRef}
          type="button"
          className={`${baseButtonClasses} ${primaryButtonClasses}`}
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls="export-menu"
          aria-label="Export data with format selection"
          disabled={isExporting !== null}
        >
          {isExporting ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Exporting {formatLabels[isExporting].label}...
            </>
          ) : (
            <>
              <Download className="w-5 h-5 mr-2" />
              Export
              <ChevronDown className={`w-5 h-5 ml-2 -mr-1 transition-transform duration-200 ${chevronRotation}`} />
            </>
          )}
        </button>
      </div>

      <div
        ref={menuRef}
        className={`${menuContainerClasses} ${menuTransitionClasses}`}
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="export-button"
        id="export-menu"
        tabIndex={-1}
      >
        <div className="p-1 space-y-1" role="none">
          {formats.map((format) => {
            const { label, icon: Icon } = formatLabels[format];
            const isCurrentExport = isExporting === format;

            return (
              <button
                key={format}
                onClick={() => handleExport(format)}
                className={menuItemClasses(format)}
                role="menuitem"
                disabled={isExporting !== null}
              >
                <Icon className="w-5 h-5 mr-3" aria-hidden="true" />
                {isCurrentExport ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  label
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExportButton;