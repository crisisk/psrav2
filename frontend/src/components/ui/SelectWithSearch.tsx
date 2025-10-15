import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';

// Define the structure for a single option
export interface SelectOption {
  value: string;
  label: string;
}

// Define the props for the SelectWithSearch component
export interface SelectWithSearchProps {
  options: SelectOption[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

// Custom Tailwind classes for Sevensa branding
// Primary: #00A896 (Sevensa Green)
// Secondary: #2D3A45 (Sevensa Dark)
const SEVENSA_PRIMARY = '#00A896';
const SEVENSA_DARK = '#2D3A45';

const SelectWithSearch: React.FC<SelectWithSearchProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  label,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Find the currently selected option object
  const selectedOption = useMemo(
    () => options.find(option => option.value === value),
    [options, value]
  );

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) {
      return options;
    }
    return options.filter(option =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  // Handle click outside to close the dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm(''); // Clear search when closing
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && activeIndex !== -1 && listRef.current) {
      const activeItem = listRef.current.children[activeIndex] as HTMLLIElement;
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex, isOpen]);

  // Handle option selection
  const handleSelect = useCallback(
    (option: SelectOption) => {
      onChange(option.value);
      setIsOpen(false);
      setSearchTerm('');
      inputRef.current?.focus(); // Return focus to the input/button
    },
    [onChange]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (disabled) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            setActiveIndex(0);
          } else {
            setActiveIndex(prevIndex =>
              prevIndex < filteredOptions.length - 1 ? prevIndex + 1 : prevIndex
            );
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (isOpen) {
            setActiveIndex(prevIndex => (prevIndex > 0 ? prevIndex - 1 : 0));
          }
          break;
        case 'Enter':
          event.preventDefault();
          if (isOpen && activeIndex !== -1) {
            handleSelect(filteredOptions[activeIndex]);
          } else if (!isOpen) {
            setIsOpen(true);
          }
          break;
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          setSearchTerm('');
          inputRef.current?.focus();
          break;
        case 'Tab':
          if (isOpen) {
            setIsOpen(false);
            setSearchTerm('');
          }
          break;
        default:
          // If a character key is pressed, open the dropdown and start searching
          if (!isOpen && event.key.length === 1) {
            setIsOpen(true);
            setSearchTerm(event.key);
          }
          break;
      }
    },
    [isOpen, activeIndex, filteredOptions, handleSelect, disabled]
  );

  // Update active index when filtered options change
  useEffect(() => {
    if (filteredOptions.length > 0) {
      setActiveIndex(0);
    } else {
      setActiveIndex(-1);
    }
  }, [filteredOptions.length]);

  // Handle input change (search)
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  // Toggle dropdown visibility
  const toggleDropdown = () => {
    if (disabled) return;
    setIsOpen(prev => !prev);
    if (!isOpen) {
      // When opening, focus the input and clear search if an option is already selected
      setSearchTerm('');
      inputRef.current?.focus();
    } else {
      setSearchTerm('');
    }
  };

  // Unique ID for ARIA attributes
  const listboxId = React.useId();
  const activeOptionId = activeIndex !== -1 ? `option-${activeIndex}` : undefined;

  return (
    <div
      className="relative w-full max-w-md"
      ref={wrapperRef}
      onKeyDown={handleKeyDown}
    >
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div
        className={`relative cursor-pointer rounded-lg border p-3 transition-all duration-200 ${
          disabled
            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
            : 'bg-white text-gray-900 shadow-sm hover:border-gray-400'
        } ${
          isOpen
            ? 'border-2 ring-2'
            : 'border-gray-300'
        }`}
        style={{
          borderColor: isOpen ? SEVENSA_PRIMARY : undefined,
          boxShadow: isOpen ? `0 0 0 2px ${SEVENSA_PRIMARY}40` : undefined, // Light shadow for focus ring
        }}
        onClick={toggleDropdown}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
      >
        <div className="flex items-center justify-between">
          {/* Input field for display and search */}
          <input
            ref={inputRef}
            type="text"
            value={isOpen ? searchTerm : selectedOption?.label || ''}
            onChange={handleInputChange}
            placeholder={selectedOption ? selectedOption.label : placeholder}
            className={`w-full bg-transparent focus:outline-none ${
              selectedOption && !isOpen ? 'text-gray-900' : 'text-gray-500'
            } ${isOpen ? 'cursor-text' : 'cursor-pointer'}`}
            style={{ color: selectedOption && !isOpen ? SEVENSA_DARK : undefined }}
            readOnly={!isOpen} // Only allow typing when dropdown is open
            disabled={disabled}
            aria-autocomplete="list"
            aria-activedescendant={activeOptionId}
            aria-labelledby={label ? undefined : 'select-label'} // Assuming label is provided or using a default
            id="select-input"
          />

          {/* Dropdown Arrow Icon */}
          <svg
            className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : 'rotate-0'
            }`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>

      {/* Dropdown List */}
      {isOpen && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-labelledby="select-input"
          tabIndex={-1} // Make it programmatically focusable but not via tab key
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <li
                key={option.value}
                id={`option-${index}`}
                role="option"
                aria-selected={option.value === value}
                className={`relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 transition-colors duration-150 ${
                  index === activeIndex
                    ? 'bg-gray-100'
                    : 'hover:bg-gray-50'
                } ${
                  option.value === value
                    ? 'font-semibold'
                    : 'font-normal'
                }`}
                style={{
                  backgroundColor: index === activeIndex ? '#F0F0F0' : undefined,
                  color: option.value === value ? SEVENSA_PRIMARY : SEVENSA_DARK,
                }}
                onClick={() => handleSelect(option)}
              >
                <span className="block truncate">{option.label}</span>
                {option.value === value && (
                  <span
                    className="absolute inset-y-0 right-0 flex items-center pr-4"
                    style={{ color: SEVENSA_PRIMARY }}
                  >
                    {/* Checkmark icon */}
                    <svg
                      className="h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </li>
            ))
          ) : (
            <li className="py-2 px-3 text-gray-500">No results found.</li>
          )}
        </ul>
      )}
    </div>
  );
};

export default SelectWithSearch;