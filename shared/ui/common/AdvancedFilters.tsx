import { useState } from 'react';
import { ChevronDown, ChevronUp, X, Filter } from 'lucide-react';
import { trackEvent } from '@/shared/lib/telemetry';

interface FilterValues {
  dateFrom: string;
  dateTo: string;
  verdicts: string[];
  agreements: string[];
  riskLevels: string[];
  searchText: string;
  sortField: string;
  sortDirection: 'asc' | 'desc';
}

interface AdvancedFiltersProps {
  initialValues?: Partial<FilterValues>;
  onApply: (filters: FilterValues) => void;
  onReset: () => void;
}

const defaultFilters: FilterValues = {
  dateFrom: '',
  dateTo: '',
  verdicts: [],
  agreements: [],
  riskLevels: [],
  searchText: '',
  sortField: 'createdAt',
  sortDirection: 'desc'
};

const verdictOptions = [
  { label: 'Qualifying', value: 'qualifying' },
  { label: 'Non-Qualifying', value: 'non-qualifying' },
  { label: 'Pending', value: 'pending' }
];

const agreementOptions = [
  { label: 'EU-Japan', value: 'eu-japan' },
  { label: 'EU-Korea', value: 'eu-korea' },
  { label: 'CETA', value: 'ceta' },
  { label: 'CPTPP', value: 'cptpp' }
];

const riskOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' }
];

const sortOptions = [
  { label: 'Created Date', value: 'createdAt' },
  { label: 'Product Name', value: 'productName' },
  { label: 'Status', value: 'status' },
  { label: 'Risk Level', value: 'riskLevel' }
];

export const AdvancedFilters = ({ initialValues, onApply, onReset }: AdvancedFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({
    ...defaultFilters,
    ...initialValues
  });

  const handleCheckboxChange = (field: keyof Pick<FilterValues, 'verdicts' | 'agreements' | 'riskLevels'>, value: string) => {
    const current = filters[field];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];

    setFilters({ ...filters, [field]: updated });
  };

  const handleApply = () => {
    onApply(filters);
    trackEvent('filter_action', { action: 'apply', filters });
  };

  const handleReset = () => {
    setFilters(defaultFilters);
    onReset();
    trackEvent('filter_action', { action: 'reset' });
  };

  const activeFilterCount =
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0) +
    filters.verdicts.length +
    filters.agreements.length +
    filters.riskLevels.length +
    (filters.searchText ? 1 : 0);

  return (
    <div className="bg-white dark:bg-dark-bg-surface rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-dark-bg-base transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-sevensa-teal" />
          <span className="font-semibold">Advanced Filters</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-sevensa-teal text-white text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>

      {/* Filters */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium mb-2">Search</label>
            <input
              type="text"
              value={filters.searchText}
              onChange={(e) => setFilters({ ...filters, searchText: e.target.value })}
              placeholder="Search assessments..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sevensa-teal"
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">From Date</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sevensa-teal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">To Date</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sevensa-teal"
              />
            </div>
          </div>

          {/* Verdicts */}
          <div>
            <label className="block text-sm font-medium mb-2">Verdicts</label>
            <div className="flex flex-wrap gap-2">
              {verdictOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.verdicts.includes(option.value)}
                    onChange={() => handleCheckboxChange('verdicts', option.value)}
                    className="rounded"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Agreements */}
          <div>
            <label className="block text-sm font-medium mb-2">Trade Agreements</label>
            <div className="flex flex-wrap gap-2">
              {agreementOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.agreements.includes(option.value)}
                    onChange={() => handleCheckboxChange('agreements', option.value)}
                    className="rounded"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Risk Levels */}
          <div>
            <label className="block text-sm font-medium mb-2">Risk Levels</label>
            <div className="flex flex-wrap gap-2">
              {riskOptions.map((option) => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.riskLevels.includes(option.value)}
                    onChange={() => handleCheckboxChange('riskLevels', option.value)}
                    className="rounded"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Sort By</label>
              <select
                value={filters.sortField}
                onChange={(e) => setFilters({ ...filters, sortField: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sevensa-teal"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Direction</label>
              <select
                value={filters.sortDirection}
                onChange={(e) => setFilters({ ...filters, sortDirection: e.target.value as 'asc' | 'desc' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sevensa-teal"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-2 bg-sevensa-teal text-white rounded-lg hover:bg-sevensa-teal-600 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;
