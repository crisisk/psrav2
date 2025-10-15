
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  RowData,
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

declare module '@tanstack/react-table' {
    interface TableMeta<TData extends RowData> {
      updateData: (rowIndex: number, columnId: string, value: unknown) => void
      enableInlineEditing: boolean
    }
  }

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

// D. Indeterminate Checkbox Component
const IndeterminateCheckbox = React.forwardRef<
  HTMLInputElement,
  { indeterminate?: boolean } & React.HTMLProps<HTMLInputElement>
>(({ indeterminate, ...rest }, ref) => {
  const defaultRef = React.useRef<HTMLInputElement>(null!);
  const resolvedRef = ref || defaultRef;

  React.useEffect(() => {
    if (typeof resolvedRef === 'object' && resolvedRef.current) {
      resolvedRef.current.indeterminate = !!indeterminate;
    }
  }, [resolvedRef, indeterminate]);

  return (
    <input
      type="checkbox"
      ref={resolvedRef}
      {...rest}
    />
  );
});

// A. Inline Editing Cell Component
const EditableCell = (props: CellContext<DataGridRow, any>) => {
  const { getValue, row, column, table } = props;
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
          {flexRender(column.columnDef.cell, props)}
        </span>
      )}
    </div>
  );
};

// B. Column Filter Component
const ColumnFilter = ({ column, table }: { column: any, table: any }) => {
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
const ColumnHeader = (props: any) => {
  const { column, table } = props;
  const { enableInlineEditing } = table.options.meta as { updateData: (rowIndex: number, columnId: string, value: unknown) => void, enableInlineEditing: boolean };

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
        {flexRender(column.columnDef.header, props)}
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
          <IndeterminateCheckbox
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
        ...(col as ColumnDef<DataGridRow>),
        cell: enableInlineEditing ? EditableCell : col.cell,
        header: (props) => <ColumnHeader {...props} />,
      } as ColumnDef<DataGridRow>);
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
    <div className="p-4 bg-white shadow-lg rounded-lg font-sans">
      {/* Header: Global Filter and Actions */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-sevensa-neutral-500" />
          <input
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(String(e.target.value))}
            className="p-2 border border-sevensa-neutral-300 rounded-md shadow-sm focus:ring-sevensa-primary-500 focus:border-sevensa-primary-500 text-sm"
            placeholder="Search all columns..."
            aria-label="Search all columns"
          />
        </div>
        {selectedRowCount > 0 && (
          <div className="text-sm text-sevensa-neutral-600 font-medium">
            {selectedRowCount} of {table.getPrePaginationRowModel().rows.length} row(s) selected.
          </div>
        )}
      </div>

      {/* Table Container with Resizing styles */}
      <div className="overflow-x-auto">
        <table
          className="min-w-full border-collapse text-sm"
          style={{ width: table.getCenterTotalSize() }}
        >
          <thead className="bg-sevensa-neutral-50 border-b-2 border-sevensa-neutral-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="p-0 relative"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    {header.column.getCanFilter() ? (
                      <ColumnFilter column={header.column} table={table} />
                    ) : null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className={`border-b border-sevensa-neutral-200 ${
                  row.getIsSelected() ? 'bg-sevensa-primary-50' : 'hover:bg-sevensa-neutral-50'
                }`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="p-0"
                    style={{ width: cell.column.getSize() }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-sevensa-neutral-100 font-semibold border-t-2 border-sevensa-neutral-300">
            {table.getFooterGroups().map((footerGroup) => (
              <tr key={footerGroup.id}>
                {footerGroup.headers.map((header) => (
                  <th key={header.id} className="p-2 text-left">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.footer,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </tfoot>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-4 flex-wrap gap-2 text-sm text-sevensa-neutral-600">
        <div className="flex items-center gap-2">
          <span className="font-medium">Rows per page:</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
            className="p-1 border border-sevensa-neutral-300 rounded-md focus:ring-sevensa-primary-500 focus:border-sevensa-primary-500"
            aria-label="Select page size"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span>
            Page {' '}
            <strong>
              {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </strong>
          </span>
          <span className="hidden sm:inline">|
            Go to page:
            <input
              type="number"
              defaultValue={table.getState().pagination.pageIndex + 1}
              onChange={(e) => {
                const page = e.target.value ? Number(e.target.value) - 1 : 0;
                table.setPageIndex(page);
              }}
              className="border p-1 rounded w-16 ml-1 text-center border-sevensa-neutral-300 focus:ring-sevensa-primary-500 focus:border-sevensa-primary-500"
              aria-label="Go to page number"
            />
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            className="p-1 rounded-md border border-sevensa-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sevensa-neutral-100"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label="Go to first page"
          >
            <ChevronsLeft className="w-5 h-5" />
          </button>
          <button
            className="p-1 rounded-md border border-sevensa-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sevensa-neutral-100"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            className="p-1 rounded-md border border-sevensa-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sevensa-neutral-100"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Go to next page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            className="p-1 rounded-md border border-sevensa-neutral-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sevensa-neutral-100"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            aria-label="Go to last page"
          >
            <ChevronsRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 6. DEFAULT EXPORT & EXAMPLE USAGE ---

const defaultColumns: ColumnDef<DataGridRow>[] = [
  { accessorKey: 'firstName', header: 'First Name', size: 150 },
  { accessorKey: 'lastName', header: 'Last Name', size: 150 },
  { accessorKey: 'age', header: 'Age', size: 80 },
  { accessorKey: 'status', header: 'Status', size: 120 },
  { accessorKey: 'visits', header: 'Visits', size: 100 },
  { accessorKey: 'progress', header: 'Profile Progress', size: 150 },
];

/**
 * A feature-rich and production-ready DataGrid component built with TanStack Table v8.
 *
 * Features:
 * - Pagination
 * - Global and column-based filtering
 * - Sorting
 * - Row selection
 * - Inline editing (optional)
 * - Column resizing
 * - TypeScript support
 * - Styled with Tailwind CSS for Sevensa branding
 * - Accessibility in mind
 *
 * @example
 * <DataGrid
 *   data={myData}
 *   columns={myColumns}
 *   enableRowSelection={true}
 *   enableInlineEditing={true}
 *   onDataChange={handleDataUpdate}
 * />
 */
const DataGridWrapper = () => {
  const [data, setData] = useState(mockData);

  const handleDataChange = (newData: DataGridRow[]) => {
    console.log('Data updated:', newData);
    setData(newData);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Sevensa DataGrid</h1>
      <DataGrid
        data={data}
        columns={defaultColumns}
        onDataChange={handleDataChange}
      />
    </div>
  );
};

export default DataGridWrapper;

