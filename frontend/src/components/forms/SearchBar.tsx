import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Filter, Clock, X, ChevronDown, Check } from 'lucide-react';

// --- Types ---

/** Defines the structure for a filter option. */
interface FilterOption {
  id: string;
  label: string;
  value: string;
}

/** Defines the structure for a recent search item. */
interface RecentSearch {
  id: string;
  query: string;
  timestamp: number;
}

/** Defines the structure for a suggestion item. */
interface Suggestion {
  id: string;
  text: string;
  type: 'keyword' | 'product' | 'category';
}

/** Defines the props for the SearchBar component. */
interface SearchBarProps {
  /** The current search query value. */
  value: string;
  /** Callback function when the search query changes. */
  onChange: (query: string) => void;
  /** Callback function when a search is submitted. */
  onSubmit: (query: string, filters: Record<string, string>) => void;
  /** Array of available filter options. */
  filterOptions: FilterOption[];
  /** Placeholder text for the search input. */
  placeholder?: string;
  /** Initial selected filter value. */
  initialFilter?: string;
  /** Optional list of recent searches. */
  recentSearches?: RecentSearch[];
  /** Optional list of search suggestions. */
  suggestions?: Suggestion[];
  /** Sevensa branding color (Tailwind class). */
  primaryColor?: string;
  /** Sevensa accent color (Tailwind class). */
  accentColor?: string;
}

// --- Dummy Data (for demonstration) ---

const DUMMY_FILTER_OPTIONS: FilterOption[] = [
  { id: 'all', label: 'All', value: 'all' },
  { id: 'products', label: 'Products', value: 'products' },
  { id: 'users', label: 'Users', value: 'users' },
  { id: 'documents', label: 'Documents', value: 'documents' },
];

const DUMMY_RECENT_SEARCHES: RecentSearch[] = [
  { id: 'r1', query: 'Q3 Financial Report', timestamp: Date.now() - 3600000 },
  { id: 'r2', query: 'New feature rollout plan', timestamp: Date.now() - 86400000 },
];

const DUMMY_SUGGESTIONS: Suggestion[] = [
  { id: 's1', text: 'Financial Report 2024', type: 'document' },
  { id: 's2', text: 'Project Phoenix', type: 'project' },
  { id: 's3', text: 'John Doe', type: 'user' },
];

// --- Sub-Components ---

interface DropdownItemProps {
  icon: React.ReactNode;
  text: string;
  onClick: () => void;
  isFilter?: boolean;
  isSelected?: boolean;
}

const DropdownItem: React.FC<DropdownItemProps> = ({ icon, text, onClick, isFilter = false, isSelected = false }) => {
  // Default Sevensa colors are 'blue-700' and 'amber-500'
  const primaryColor = 'blue-700';
  const accentColor = 'amber-500';

  const baseClasses = 'flex items-center p-2 text-sm rounded-md cursor-pointer transition-colors';
  const hoverClasses = isFilter ? 'hover:bg-gray-100' : `hover:bg-${primaryColor.replace('-700', '-50')}`;
  const textClasses = isFilter ? 'text-gray-700' : `text-${primaryColor}`;

  return (
    <div className={`${baseClasses} ${hoverClasses}`} onClick={onClick}>
      <span className={`mr-3 ${textClasses}`}>{icon}</span>
      <span className="flex-grow">{text}</span>
      {isSelected && <Check className={`w-4 h-4 text-${accentColor} ml-2`} />}
    </div>
  );
};

// --- Main Component ---

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  onSubmit,
  filterOptions = DUMMY_FILTER_OPTIONS,
  placeholder = 'Search Sevensa...',
  initialFilter = 'all',
  recentSearches = DUMMY_RECENT_SEARCHES,
  suggestions = DUMMY_SUGGESTIONS,
  primaryColor = 'blue-700', // Sevensa Primary
  accentColor = 'amber-500', // Sevensa Accent
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(initialFilter);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- Validation Logic ---
  const validate = useCallback((query: string) => {
    if (query.trim().length < 2 && query.trim().length > 0) {
      return 'Search query must be at least 2 characters long.';
    }
    setError(null);
    return null;
  }, []);

  // --- Handlers ---

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    onChange(newQuery);
    validate(newQuery);
    // Open dropdown on input change if query is not empty
    if (newQuery.length > 0) {
      setIsDropdownOpen(true);
    } else if (newQuery.length === 0) {
      // Keep dropdown open to show recent searches/filters if it was already open
      // or open it if the user is just focusing on the bar
      setIsDropdownOpen(true);
    }
  };

  const handleFilterSelect = (filterValue: string) => {
    setSelectedFilter(filterValue);
    // Keep dropdown open to allow for immediate search or further filtering
    inputRef.current?.focus();
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // Only validate if the user is submitting a non-empty query
    if (value.trim().length > 0) {
      const validationError = validate(value);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    // If query is empty, treat it as a search for 'all' with the current filter
    const queryToSubmit = value.trim() || '*';
    
    // Save to recent searches logic would go here in a real app
    onSubmit(queryToSubmit, { filter: selectedFilter });
    setIsDropdownOpen(false);
  };

  const handleRecentSearchClick = (query: string) => {
    onChange(query);
    handleSearchSubmit();
  };

  const handleSuggestionClick = (text: string) => {
    onChange(text);
    handleSearchSubmit();
  };

  // --- Dropdown Management ---

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // --- Rendering Logic ---

  const filteredSuggestions = suggestions.filter(s =>
    s.text.toLowerCase().includes(value.toLowerCase())
  );

  const showSuggestions = value.length > 0 && filteredSuggestions.length > 0;
  const showRecentSearches = value.length === 0 && recentSearches.length > 0;

  const filterLabel = filterOptions.find(f => f.value === selectedFilter)?.label || 'Filter';

  // Sevensa Styling: Primary Blue for focus/border, Amber for accent/icons
  const baseClasses = 'w-full max-w-xl mx-auto relative';
  const inputContainerClasses = `flex items-center border border-gray-300 rounded-lg shadow-md transition-all duration-200 focus-within:ring-2 focus-within:ring-${primaryColor} focus-within:border-${primaryColor}`;
  const inputClasses = 'flex-grow p-3 text-gray-800 focus:outline-none bg-transparent';
  const filterButtonClasses = `flex items-center px-3 text-sm font-medium text-gray-600 border-r border-gray-200 hover:bg-gray-50 transition-colors`;
  const searchIconClasses = `p-3 text-${accentColor}`;
  const clearButtonClasses = `p-3 text-gray-400 hover:text-${accentColor} transition-colors`;
  const dropdownClasses = 'absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden';
  const errorClasses = 'mt-1 text-sm text-red-600';

  return (
    <div className={baseClasses}>
      <form onSubmit={handleSearchSubmit}>
        <div className={inputContainerClasses}>
          {/* Filter/Dropdown Button */}
          <div className="relative group">
            <button
              type="button"
              className={filterButtonClasses}
              onClick={() => setIsDropdownOpen(prev => !prev)}
              onFocus={() => setIsDropdownOpen(true)} // Open dropdown on focus
              aria-expanded={isDropdownOpen}
              aria-controls="search-dropdown"
            >
              <Filter className={`w-4 h-4 mr-2 text-${accentColor}`} />
              {filterLabel}
              <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Search Input */}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={inputClasses}
            aria-label="Search input"
          />

          {/* Clear Button */}
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className={clearButtonClasses}
              aria-label="Clear search input"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Search Button */}
          <button
            type="submit"
            className={searchIconClasses}
            aria-label="Submit search"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </form>

      {error && <p className={errorClasses}>{error}</p>}

      {/* Main Dropdown (Filters, Suggestions & Recent Searches) */}
      {isDropdownOpen && (
        <div ref={dropdownRef} id="search-dropdown" className={dropdownClasses}>
          <div className="p-2">
            {/* Filters Section (Always visible when dropdown is open) */}
            <p className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase">Filter By</p>
            <div className="grid grid-cols-2 gap-1 mb-2">
              {filterOptions.map(option => (
                <DropdownItem
                  key={option.id}
                  icon={<Filter className="w-4 h-4" />}
                  text={option.label}
                  onClick={() => handleFilterSelect(option.value)}
                  isFilter={true}
                  isSelected={selectedFilter === option.value}
                />
              ))}
            </div>
            <hr className="my-2 border-gray-100" />

            {/* Suggestions */}
            {showSuggestions && (
              <>
                <p className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase">Suggestions</p>
                {filteredSuggestions.map(suggestion => (
                  <DropdownItem
                    key={suggestion.id}
                    icon={<Search className="w-4 h-4" />}
                    text={suggestion.text}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                  />
                ))}
                <hr className="my-2 border-gray-100" />
              </>
            )}

            {/* Recent Searches */}
            {showRecentSearches && (
              <>
                <p className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase">Recent Searches</p>
                {recentSearches.slice(0, 5).map(search => (
                  <DropdownItem
                    key={search.id}
                    icon={<Clock className="w-4 h-4" />}
                    text={search.query}
                    onClick={() => handleRecentSearchClick(search.query)}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Export the component as default
export default SearchBar;