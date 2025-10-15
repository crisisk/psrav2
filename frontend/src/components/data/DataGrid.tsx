import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
  Row,
  CellContext,
  ColumnResizeMode,
  RowSelectionState,
  Table,
} from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Filter,
  Pencil,
  Save,
  X,
} from 'lucide-react';

// --- 1. TYPESCRIPT DEFINITIONS ---

// Define the shape of the data
export type DataGridRow = {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  status: 'relationship' | 'single' | 'complicated';
  visits: number;
  progress: number;
};

// Define the props for the DataGrid component
export interface DataGridProps {
  data: DataGridRow[];
  columns: ColumnDef<DataGridRow>[];
  pageSizeOptions?: number[];
  initialPageSize?: number;
  enableRowSelection?: boolean;
  enableInlineEditing?: boolean;
  onDataChange?: (data: DataGridRow[]) => void;
}

// --- 2. MOCK DATA (for demonstration) ---

const mockData: DataGridRow[] = [
  { id: '1', firstName: 'Tanner', lastName: 'Linsley', age: 24, status: 'relationship', visits: 100, progress: 50 },
  { id: '2', firstName: 'Kevin', lastName: 'Vandy', age: 20, status: 'single', visits: 40, progress: 80 },
  { id: '3', firstName: 'Lois', lastName: 'Griffin', age: 35, status: 'complicated', visits: 55, progress: 20 },
  { id: '4', firstName: 'Peter', lastName: 'Griffin', age: 42, status: 'relationship', visits: 120, progress: 90 },
  { id: '5', firstName: 'Stewie', lastName: 'Griffin', age: 1, status: 'single', visits: 5, progress: 10 },
  { id: '6', firstName: 'Meg', lastName: 'Griffin', age: 16, status: 'complicated', visits: 20, progress: 65 },
  { id: '7', firstName: 'Chris', lastName: 'Griffin', age: 14, status: 'relationship', visits: 30, progress: 45 },
  { id: '8', firstName: 'Brian', lastName: 'Griffin', age: 8, status: 'single', visits: 70, progress: 75 },
  { id: '9', firstName: 'Joe', lastName: 'Swanson', age: 45, status: 'relationship', visits: 90, progress: 30 },
  { id: '10', firstName: 'Quagmire', lastName: 'Glenn', age: 40, status: 'single', visits: 150, progress: 99 },
];

// --- 3. HELPER COMPONENTS ---

// A. Inline Editing Cell Component
const EditableCell = ({ getValue, row, column, table }: CellContext<DataGridRow, any>) => {
  const initialValue = getValue();
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(false);

  // When the input is blurred, we'll update the original data
  const onBlur = () => {
    setIsEditing(false);
    if (value !== initialValue) {
      table.options.meta?.updateData(row.index, column.id, value);
    }
  };

  // If the initialValue changes, update the local state
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onBlur();
    }
    if (e.key === 'Escape') {
      setValue(initialValue);
      setIsEditing(false);
    }
  };

  return (
    <div className="relative h-full flex items-center">
      {isEditing ? (
        <input
          value={value as string | number}
          onChange={(e) => setValue(e.target.value)}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          className="w-full p-1 border border-sevensa-primary-500 rounded shadow-inner focus:outline-none focus:ring-1 focus:ring-sevensa-primary-500"
          autoFocus
          aria-label={`Edit ${column.columnDef.header} for row ${row.index + 1}`}
        />
      ) : (
        <span
          className="w-full h-full flex items-center p-1 cursor-pointer hover:bg-sevensa-neutral-100"
          onClick={() => setIsEditing(true)}
          role="button"
          tabIndex={0}
          aria-label={`Current value: ${initialValue}. Click to edit.`}
        >
          {flexRender(column.columnDef.cell, { getValue, row, column, table })}
        </span>
      )}
    </div>
  );
};

// B. Column Filter Component
const ColumnFilter = ({ column, table }: CellContext<DataGridRow, any>) => {
  const columnFilterValue = column.getFilterValue();

  return (
    <div className="flex items-center space-x-1 p-1">
      <Filter className="w-3 h-3 text-sevensa-primary-500" />
      <input
        type="text"
        value={(columnFilterValue ?? '') as string}
        onChange={(e) => column.setFilterValue(e.target.value)}
        placeholder={`Filter ${column.columnDef.header}...`}
        className="w-full text-xs border border-sevensa-neutral-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-sevensa-primary-500"
        aria-label={`Filter by ${column.columnDef.header}`}
      />
    </div>
  );
};

// C. Column Header with Sorting and Resizing
const ColumnHeader = ({ column, table }: CellContext<DataGridRow, any>) => {
  const { enableInlineEditing } = table.options.meta as { enableInlineEditing: boolean };

  // Skip sorting/filtering for the selection column and the action column
  const isSpecialColumn = column.id === 'select' || (enableInlineEditing && column.id === 'actions');

  return (
    <div
      className={`flex items-center justify-between p-2 font-semibold text-sevensa-neutral-700 ${
        column.getCanSort() && !isSpecialColumn ? 'cursor-pointer select-none' : ''
      }`}
      onClick={column.getToggleSortingHandler()}
      title={column.columnDef.header as string}
    >
      <span className="truncate">
        {flexRender(column.columnDef.header, { column, table })}
      </span>
      {!isSpecialColumn && column.getCanSort() && (
        <span className="ml-2">
          {{
            asc: <ArrowUpDown className="w-4 h-4 text-sevensa-primary-500 rotate-180" />,
            desc: <ArrowUpDown className="w-4 h-4 text-sevensa-primary-500" />,
          }[column.getIsSorted() as string] ?? <ArrowUpDown className="w-4 h-4 text-sevensa-neutral-400" />}
        </span>
      )}
      {column.getCanResize() && (
        <div
          onMouseDown={column.getResizeHandler()}
          onTouchStart={column.getResizeHandler()}
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize select-none ${
            column.getIsResizing() ? 'bg-sevensa-primary-500' : 'hover:bg-sevensa-primary-300'
          }`}
          aria-label={`Resize column ${column.columnDef.header}`}
        />
      )}
    </div>
  );
};

// --- 4. DATA GRID COMPONENT ---

export const DataGrid = ({
  data: initialData,
  columns: initialColumns,
  pageSizeOptions = [10, 20, 30, 40, 50],
  initialPageSize = 10,
  enableRowSelection = true,
  enableInlineEditing = true,
  onDataChange,
}: DataGridProps) => {
  const [data, setData] = useState(initialData);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');

  // Update local state when initialData prop changes
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Function to update a single cell's data
  const updateData = useCallback(
    (rowIndex: number, columnId: string, value: any) => {
      setData((old) =>
        old.map((row, index) => {
          if (index === rowIndex) {
            const newRow = {
              ...old[rowIndex]!,
              [columnId]: value,
            };
            // Notify parent component of the change
            if (onDataChange) {
              onDataChange(old.map((r, i) => (i === rowIndex ? newRow : r)));
            }
            return newRow;
          }
          return row;
        })
      );
    },
    [onDataChange]
  );

  // Define the columns, including the selection column and potentially the action column
  const columns = useMemo(() => {
    const cols: ColumnDef<DataGridRow>[] = [];

    if (enableRowSelection) {
      cols.push({
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            checked={table.getIsAllRowsSelected()}
            indeterminate={table.getIsSomeRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
            className="form-checkbox h-4 w-4 text-sevensa-primary-600 rounded border-sevensa-neutral-300 focus:ring-sevensa-primary-500"
            aria-label="Select all rows"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={row.getToggleSelectedHandler()}
            className="form-checkbox h-4 w-4 text-sevensa-primary-600 rounded border-sevensa-neutral-300 focus:ring-sevensa-primary-500"
            aria-label={`Select row ${row.index + 1}`}
          />
        ),
        size: 40,
        enableSorting: false,
        enableColumnFilter: false,
        enableResizing: false,
      });
    }

    // Map initial columns, applying EditableCell if inline editing is enabled
    initialColumns.forEach((col) => {
      cols.push({
        ...col,
        cell: enableInlineEditing ? EditableCell : col.cell,
        header: (props) => <ColumnHeader {...props} />,
        footer: (props) => props.column.id === 'progress' ? 'Avg Progress' : undefined,
      });
    });

    return cols;
  }, [initialColumns, enableRowSelection, enableInlineEditing]);

  const table = useReactTable({
    data,
    columns,
    columnResizeMode: 'onChange' as ColumnResizeMode,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      rowSelection,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: initialPageSize,
      },
    },
    meta: {
      updateData,
      enableInlineEditing,
    },
  });

  const selectedRowCount = Object.keys(rowSelection).length;

  // --- 5. RENDER LOGIC ---

  return (
    <div className="p-4 bg-white rounded-lg shadow-xl border border-sevensa-neutral-200 font-sans">
      {/* Global Filter and Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-5 h-5 text-sevensa-primary-500" />
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search all columns..."
            className="p-2 border border-sevensa-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sevensa-primary-500 w-full sm:w-64 transition duration-150"
            aria-label="Global search filter"
          />
        </div>
        {selectedRowCount > 0 && (
          <div className="text-sm font-medium text-sevensa-primary-600">
            {selectedRowCount} row(s) selected
          </div>
        )}
        {/* Placeholder for custom actions (e.g., Export, Add New) */}
        <div className="flex space-x-2">
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-sevensa-primary-600 rounded-lg hover:bg-sevensa-primary-700 transition duration-150 shadow-md"
            aria-label="Export data"
          >
            Export
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto relative border border-sevensa-neutral-300 rounded-lg">
        <table
          {...{
            style: {
              width: table.getCenterTotalSize(),
            },
          }}
          className="w-full text-sm text-left text-sevensa-neutral-500 divide-y divide-sevensa-neutral-200"
          role="grid"
          aria-label="Advanced Data Grid"
        >
          {/* Table Header */}
          <thead className="text-xs text-sevensa-neutral-700 uppercase bg-sevensa-neutral-50 border-b border-sevensa-neutral-300">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} role="row">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    scope="col"
                    className="relative px-2 py-3 font-medium"
                    style={{ width: header.getSize() }}
                    role="columnheader"
                    aria-sort={
                      header.column.getIsSorted()
                        ? header.column.getIsSorted() === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                    }
                  >
                    <ColumnHeader column={header.column} table={table as Table<DataGridRow>} />
                    {header.column.getCanFilter() && (
                      <div className="mt-1">
                        <ColumnFilter column={header.column} table={table as Table<DataGridRow>} />
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          {/* Table Body */}
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={`bg-white border-b hover:bg-sevensa-neutral-50 transition duration-100 ${
                  row.getIsSelected() ? 'bg-sevensa-primary-50/50' : ''
                }`}
                role="row"
                aria-selected={row.getIsSelected()}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-2 py-2 whitespace-nowrap"
                    style={{ width: cell.column.getSize() }}
                    role="gridcell"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr role="row">
                <td colSpan={columns.length} className="text-center py-8 text-sevensa-neutral-500">
                  No data found.
                </td>
              </tr>
            )}
          </tbody>

          {/* Table Footer (Optional) */}
          <tfoot className="text-xs text-sevensa-neutral-700 uppercase bg-sevensa-neutral-50 border-t border-sevensa-neutral-300">
            {table.getFooterGroups().map((footerGroup) => (
              <tr key={footerGroup.id} role="row">
                {footerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    scope="col"
                    className="px-2 py-3 font-medium text-right"
                    style={{ width: header.getSize() }}
                    role="columnheader"
                  >
                    {flexRender(header.column.columnDef.footer, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </tfoot>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between mt-4 space-y-2 sm:space-y-0">
        {/* Page Size Selector */}
        <div className="flex items-center space-x-2 text-sm text-sevensa-neutral-600">
          <span>Rows per page:</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
            className="p-1 border border-sevensa-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-sevensa-primary-500"
            aria-label="Select rows per page"
          >
            {pageSizeOptions.map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </div>

        {/* Page Info */}
        <span className="text-sm text-sevensa-neutral-600">
          Page{' '}
          <span className="font-medium">
            {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
        </span>

        {/* Navigation Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="p-2 border border-sevensa-neutral-300 rounded-lg text-sevensa-neutral-600 hover:bg-sevensa-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
            aria-label="Go to first page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-2 border border-sevensa-neutral-300 rounded-lg text-sevensa-neutral-600 hover:bg-sevensa-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
            aria-label="Go to previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-2 border border-sevensa-neutral-300 rounded-lg text-sevensa-neutral-600 hover:bg-sevensa-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
            aria-label="Go to next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="p-2 border border-sevensa-neutral-300 rounded-lg text-sevensa-neutral-600 hover:bg-sevensa-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
            aria-label="Go to last page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 6. EXAMPLE USAGE (for demonstration) ---

// Define the columns for the example
const defaultColumns: ColumnDef<DataGridRow>[] = [
  {
    accessorKey: 'firstName',
    header: 'First Name',
    footer: (props) => props.column.id,
  },
  {
    accessorKey: 'lastName',
    header: 'Last Name',
  },
  {
    accessorKey: 'age',
    header: 'Age',
    cell: (info) => info.getValue(),
    footer: (props) => props.column.id,
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    accessorKey: 'visits',
    header: 'Visits',
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: 'progress',
    header: 'Profile Progress',
    cell: ({ row }) => (
      <div className="w-full bg-sevensa-neutral-200 rounded-full h-2.5">
        <div
          className="bg-sevensa-primary-600 h-2.5 rounded-full"
          style={{ width: `${row.original.progress}%` }}
          role="progressbar"
          aria-valuenow={row.original.progress}
          aria-valuemin={0}
          aria-valuemax={100}
        ></div>
      </div>
    ),
  },
];

// Export the component with mock data for easy testing/preview
const DataGridComponent = () => {
  const [data, setData] = useState(mockData);

  const handleDataChange = (newData: DataGridRow[]) => {
    // In a real application, this is where you would call your API to save the changes
    console.log('Data changed:', newData);
    setData(newData);
  };

  return (
    <div className="p-8 bg-sevensa-neutral-100 min-h-screen">
      <h1 className="text-2xl font-bold text-sevensa-neutral-800 mb-6">Sevensa Advanced Data Grid</h1>
      <DataGrid
        data={data}
        columns={defaultColumns}
        enableRowSelection={true}
        enableInlineEditing={true}
        onDataChange={handleDataChange}
      />
    </div>
  );
};

export default DataGridComponent;