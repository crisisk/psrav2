import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, X, Search, Check, AlertTriangle } from 'lucide-react';

// --- Types ---

/**
 * Defines the structure for a single selectable option.
 */
export type MultiSelectOption = {
  value: string | number;
  label: string;
};

/**
 * Defines the props for the MultiSelect component.
 */
export interface MultiSelectProps {
  /** The unique name for the form field. */
  name: string;
  /** Array of all available options. */
  options: MultiSelectOption[];
  /** Array of currently selected option values. */
  value: (string | number)[];
  /** Callback function to handle changes in selection. */
  onChange: (value: (string | number)[]) => void;
  /** Placeholder text for the input field. */
  placeholder?: string;
  /** Optional label for the component. */
  label?: string;
  /** Optional error message for form validation. */
  error?: string;
  /** Whether the component is disabled. */
  disabled?: boolean;
  /** Maximum number of tags to display before showing a count. Default is 3. */
  maxTags?: number;
}

// --- Constants & Styling (Sevensa Branding) ---

// Note: SEVENSA_PRIMARY is defined but not used in this component, kept for branding consistency.
const SEVENSA_BORDER = 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500';
const SEVENSA_RING_FOCUS = 'focus:ring-1 focus:ring-indigo-500';
const SEVENSA_TAG = 'bg-indigo-100 text-indigo-800 border border-indigo-200';
const SEVENSA_HOVER_ITEM = 'hover:bg-indigo-50';
const SEVENSA_CHECKED_ITEM = 'bg-indigo-50 text-indigo-800 font-medium';
const SEVENSA_ERROR_BORDER = 'border-red-500 focus:border-red-500 focus:ring-red-500';

// --- Component ---

const MultiSelect: React.FC<MultiSelectProps> = ({
  name,
  options,
  value,
  onChange,
  placeholder = 'Select one or more options...',
  label,
  error,
  disabled = false,
  maxTags = 3,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm(''); // Clear search on close
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const lowerCaseSearch = searchTerm.toLowerCase();
    return options.filter(option =>
      option.label.toLowerCase().includes(lowerCaseSearch)
    );
  }, [options, searchTerm]);

  // Check if an option is selected
  const isSelected = useCallback((optionValue: string | number) => {
    return value.includes(optionValue);
  }, [value]);

  // Toggle selection of an option
  const handleToggleOption = useCallback((optionValue: string | number) => {
    if (disabled) return;
    const newValue = isSelected(optionValue)
      ? value.filter(v => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  }, [value, onChange, isSelected, disabled]);

  // Handle "Select All"
  const allFilteredSelected = filteredOptions.every(option => isSelected(option.value));
  const handleSelectAll = useCallback(() => {
    if (disabled) return;
    const filteredValues = filteredOptions.map(o => o.value);
    let newValue: (string | number)[];

    if (allFilteredSelected) {
      // Deselect all filtered items that are currently selected
      newValue = value.filter(v => !filteredValues.includes(v));
    } else {
      // Select all filtered items (union of current value and filtered values)
      const toAdd = filteredValues.filter(v => !value.includes(v));
      newValue = [...value, ...toAdd];
    }
    onChange(newValue);
  }, [value, onChange, filteredOptions, allFilteredSelected, disabled]);

  // Remove a single tag
  const handleRemoveTag = useCallback((optionValue: string | number) => {
    if (disabled) return;
    onChange(value.filter(v => v !== optionValue));
  }, [value, onChange, disabled]);

  // Get selected options for display
  const selectedOptions = useMemo(() => {
    return options.filter(option => isSelected(option.value));
  }, [options, isSelected]);

  // Rendered tags
  const visibleTags = selectedOptions.slice(0, maxTags);
  const hiddenTagCount = selectedOptions.length - maxTags;

  const inputBorderClass = error
    ? SEVENSA_ERROR_BORDER
    : SEVENSA_BORDER;

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      {/* Input/Display Area */}
      <div
        className={`
          flex flex-wrap items-center p-2 min-h-[38px] rounded-md border
          bg-white cursor-pointer transition duration-150 ease-in-out
          ${inputBorderClass} ${SEVENSA_RING_FOCUS}
          ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}
        `}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${name}-list`}
        tabIndex={0}
      >
        {selectedOptions.length === 0 ? (
          <span className="text-gray-500 text-sm">{placeholder}</span>
        ) : (
          <>
            {visibleTags.map(option => (
              <span
                key={option.value}
                className={`
                  flex items-center text-xs font-medium mr-1 my-0.5 px-2 py-0.5 rounded-full
                  ${SEVENSA_TAG}
                `}
                onClick={(e) => e.stopPropagation()} // Prevent closing dropdown
              >
                {option.label}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(option.value)}
                  className={`ml-1 -mr-0.5 h-4 w-4 rounded-full p-0.5 text-indigo-500 hover:bg-indigo-200 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={disabled}
                  aria-label={`Remove ${option.label}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {hiddenTagCount > 0 && (
              <span className="text-xs font-medium mr-1 my-0.5 px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                +{hiddenTagCount} more
              </span>
            )}
          </>
        )}
        <ChevronDown className={`ml-auto h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {/* Hidden input for form submission/validation. Joins values with comma. */}
      <input type="hidden" name={name} value={value.join(',')} />

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <AlertTriangle className="h-4 w-4 mr-1" />
          {error}
        </p>
      )}

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div
          className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 max-h-60 overflow-auto"
          role="listbox"
          id={`${name}-list`}
        >
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search options..."
                className={`w-full pl-10 pr-3 py-2 text-sm border rounded-md ${SEVENSA_BORDER} ${SEVENSA_RING_FOCUS}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()} // Prevent closing dropdown
                autoFocus
              />
            </div>
          </div>

          {/* Select All Option (Visible only if filtered options exist) */}
          {filteredOptions.length > 0 && (
            <div
              className={`flex items-center p-2 cursor-pointer text-sm font-medium border-b border-gray-100 ${SEVENSA_HOVER_ITEM}`}
              onClick={handleSelectAll}
              role="option"
              aria-selected={allFilteredSelected}
            >
              <input
                type="checkbox"
                checked={allFilteredSelected}
                readOnly
                className={`h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer`}
              />
              <span className="ml-3 block truncate">
                {allFilteredSelected ? 'Deselect All' : 'Select All'} ({filteredOptions.length})
              </span>
            </div>
          )}

          {/* Options List */}
          {filteredOptions.length > 0 ? (
            filteredOptions.map(option => {
              const checked = isSelected(option.value);
              return (
                <div
                  key={option.value}
                  className={`
                    flex items-center p-2 cursor-pointer text-sm transition-colors
                    ${SEVENSA_HOVER_ITEM}
                    ${checked ? SEVENSA_CHECKED_ITEM : 'text-gray-900'}
                  `}
                  onClick={() => handleToggleOption(option.value)}
                  role="option"
                  aria-selected={checked}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    readOnly
                    className={`h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer`}
                  />
                  <span className="ml-3 block truncate">{option.label}</span>
                  {checked && (
                    <Check className="ml-auto h-4 w-4 text-indigo-600" />
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-4 text-sm text-gray-500 text-center">
              No options found for "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MultiSelect;