import React, { useState, useMemo, useCallback } from 'react';
import { ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight } from 'lucide-react';

// --- Custom Tailwind Colors for Sevensa Branding ---
// Primary: #00A896 (A vibrant teal/cyan)
// Dark: #2D3A45 (A dark slate/charcoal)
// NOTE: In a real project, these would be configured in tailwind.config.js.
// For this component, we'll use inline styles or utility classes that mimic them.
// We'll use a class prefix 'sevensa-' for clarity.

// Helper component for the search icon
const SearchIcon = () => <Search className="w-4 h-4 text-gray-400" />;

// Helper component for the sort icons
const SortIcon = ({ direction }: { direction: 'asc' | 'desc' | null }) => {
  if (direction === 'asc') {
    return <ChevronUp className="w-4 h-4 ml-1 text-[#00A896]" />;
  }
  if (direction === 'desc') {
    return <ChevronDown className="w-4 h-4 ml-1 text-[#00A896]" />;
  }
  return <ChevronUp className="w-4 h-4 ml-1 text-gray-300 group-hover:text-gray-500" />;
};

// --- TypeScript Interfaces ---

/**
 * Defines the structure for a single column in the data table.
 * @template T The type of the data object for each row.
 */
export interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

/**
 * Defines the structure for a single row of data.
 * @template T The type of the data object for each row.
 */
export interface DataRow {
  [key: string]: any;
}

/**
 * Props for the DataTable component.
 * @template T The type of the data object for each row, extending DataRow.
 */
export interface DataTableProps<T extends DataRow> {
  data: T[];
  columns: Column<T>[];
  pageSizeOptions?: number[];
  initialPageSize?: number;
  tableCaption?: string;
}

// --- DataTable Component ---

/**
 * A production-ready, accessible, and responsive data table component
 * with sorting, filtering, and pagination, styled with Tailwind CSS and Sevensa branding.
 */
const DataTable = <T extends DataRow>({
  data,
  columns,
  pageSizeOptions = [10, 25, 50],
  initialPageSize = 10,
  tableCaption = 'Data Table',
}: DataTableProps<T>): JSX.Element => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [sortConfig, setSortConfig] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(null);

  // 1. Filtering Logic
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;

    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return data.filter((row) =>
      columns.some((column) => {
        const value = row[column.key];
        return String(value).toLowerCase().includes(lowerCaseSearchTerm);
      })
    );
  }, [data, searchTerm, columns]);

  // 2. Sorting Logic
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    const sortableData = [...filteredData];
    sortableData.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    return sortableData;
  }, [filteredData, sortConfig]);

  // 3. Pagination Logic
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize]);

  // --- Handlers ---

  const handleSort = useCallback(
    (key: keyof T, sortable: boolean | undefined) => {
      if (!sortable) return;

      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
      }
      setSortConfig({ key, direction });
    },
    [sortConfig]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages) {
        setCurrentPage(newPage);
      }
    },
    [totalPages]
  );

  const handlePageSizeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = Number(e.target.value);
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page on size change
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  }, []);

  // --- Render Functions ---

  const renderHeader = (column: Column<T>) => {
    const isCurrentSort = sortConfig && sortConfig.key === column.key;
    const direction = isCurrentSort ? sortConfig.direction : null;
    const ariaSort = isCurrentSort ? (direction === 'asc' ? 'ascending' : 'descending') : 'none';

    return (
      <th
        key={column.key as string}
        scope="col"
        className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
          column.sortable ? 'cursor-pointer hover:bg-gray-50 group' : ''
        }`}
        onClick={() => handleSort(column.key, column.sortable)}
        aria-sort={column.sortable ? ariaSort : undefined}
      >
        <div className="flex items-center">
          {column.header}
          {column.sortable && <SortIcon direction={direction} />}
        </div>
      </th>
    );
  };

  const renderRow = (row: T, rowIndex: number) => (
    <tr key={rowIndex} className="even:bg-gray-50 hover:bg-gray-100 transition-colors">
      {columns.map((column) => (
        <td
          key={column.key as string}
          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
          role="cell"
        >
          {column.render ? column.render(row) : String(row[column.key])}
        </td>
      ))}
    </tr>
  );

  // --- Component JSX ---

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden border border-gray-200">
      <div className="p-4 flex flex-col sm:flex-row justify-between items-center bg-gray-50 border-b border-gray-200">
        {/* Search/Filter Input */}
        <div className="relative w-full sm:w-64 mb-4 sm:mb-0">
          <input
            type="text"
            placeholder="Search table..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#00A896] focus:border-[#00A896] transition duration-150 ease-in-out text-sm"
            aria-label="Search data table"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon />
          </div>
        </div>

        {/* Page Size Selector */}
        <div className="flex items-center space-x-2 text-sm text-gray-700">
          <label htmlFor="page-size-select" className="sr-only sm:not-sr-only">
            Rows per page:
          </label>
          <select
            id="page-size-select"
            value={pageSize}
            onChange={handlePageSizeChange}
            className="py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-[#00A896] focus:border-[#00A896] text-sm"
            aria-label="Select number of rows per page"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container - Responsive Scroll */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200" role="table" aria-caption={tableCaption}>
          <caption className="sr-only">{tableCaption}</caption>
          <thead className="bg-gray-100">
            <tr>{columns.map(renderHeader)}</tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length > 0 ? (
              paginatedData.map(renderRow)
            ) : (
              <tr>
                <td colSpan={columns.length} className="px-6 py-4 text-center text-gray-500">
                  No data found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-gray-200 bg-white flex flex-col sm:flex-row justify-between items-center text-sm">
        <div className="text-gray-600 mb-2 sm:mb-0">
          Showing{' '}
          <span className="font-semibold">
            {(currentPage - 1) * pageSize + 1}
          </span>{' '}
          to{' '}
          <span className="font-semibold">
            {Math.min(currentPage * pageSize, sortedData.length)}
          </span>{' '}
          of{' '}
          <span className="font-semibold">
            {sortedData.length}
          </span>{' '}
          results
        </div>

        <nav className="flex items-center space-x-1" aria-label="Pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="px-3 py-1 text-gray-700">
            Page <span className="font-semibold text-[#2D3A45]">{currentPage}</span> of{' '}
            <span className="font-semibold text-[#2D3A45]">{totalPages}</span>
          </span>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </nav>
      </div>
    </div>
  );
};

export default DataTable;
