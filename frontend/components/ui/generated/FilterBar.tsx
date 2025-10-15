import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';

interface FilterBarProps {
  onFilterChange: (filters: Record<string, string | string[]>) => void;
  availableFilters: {
    key: string;
    label: string;
    type: 'text' | 'select' | 'multiselect';
    options?: string[];
  }[];
}

const FilterBar: React.FC<FilterBarProps> = ({ onFilterChange, availableFilters }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string | string[]>>({});
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Debounce function for search term (omitted for brevity, but should be used in a real app)
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    onFilterChange({ ...activeFilters, search: newSearchTerm });
  };

  const handleFilterChange = (key: string, value: string | string[]) => {
    const newFilters = { ...activeFilters, [key]: value };
    if (value === '' || (Array.isArray(value) && value.length === 0)) {
      delete newFilters[key];
    }
    setActiveFilters(newFilters);
    onFilterChange({ ...newFilters, search: searchTerm });
  };

  const removeFilter = (key: string) => {
    const newFilters = { ...activeFilters };
    delete newFilters[key];
    setActiveFilters(newFilters);
    onFilterChange({ ...newFilters, search: searchTerm });
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setActiveFilters({});
    onFilterChange({});
  };

  const activeFilterCount = Object.keys(activeFilters).length;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sevensa border border-gray-100">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-grow max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-sevensa-teal focus:border-sevensa-teal text-sm"
          />
        </div>

        {/* Filter Button and Clear Button */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors border
              ${activeFilterCount > 0
                ? 'bg-sevensa-teal text-white border-sevensa-teal hover:bg-sevensa-teal-dark'
                : 'bg-white text-sevensa-dark border-gray-300 hover:bg-gray-50'
              }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="flex items-center text-sm text-gray-500 hover:text-sevensa-error transition-colors"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
          {Object.entries(activeFilters).map(([key, value]) => (
            <span
              key={key}
              className="inline-flex items-center px-3 py-1 text-sm font-medium bg-sevensa-teal/10 text-sevensa-teal rounded-full"
            >
              {availableFilters.find(f => f.key === key)?.label || key}: {Array.isArray(value) ? value.join(', ') : value}
              <button
                onClick={() => removeFilter(key)}
                className="ml-2 text-sevensa-teal hover:text-sevensa-teal-dark"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Filter Panel (Simplified for this component) */}
      {isFilterPanelOpen && (
        <div className="mt-4 p-4 border border-gray-200 rounded-md space-y-3">
          <h4 className="text-lg font-semibold text-sevensa-dark">Advanced Filters</h4>
          {/* In a real app, this would render dynamic inputs based on availableFilters */}
          <p className="text-sm text-gray-500">
            Filter inputs will be rendered here dynamically based on the `availableFilters` prop.
          </p>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
