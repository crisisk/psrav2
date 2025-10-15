import React, { useState, useMemo, useCallback } from 'react';
import { Search, ArrowUpDown, ListFilter, Group, MoreVertical, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Checkbox from '@/components/ui/Checkbox';
import DropdownMenu from '@/components/navigation/DropdownMenu';
import { Card } from '@/components/ui/card';
import * as _ from 'lodash';

// --- Types Definition ---

/**
 * Defines the structure for a single data item in the list.
 * Extend this interface for specific data types.
 */
export interface ListItem {
  id: string;
  [key: string]: any; // Allow any other properties
}

/**
 * Defines a column for the list view.
 */
export interface ListColumn<T extends ListItem> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  filterable?: boolean;
  groupBy?: boolean;
  render: (item: T) => React.ReactNode;
}

/**
 * Defines a bulk action that can be performed on selected items.
 */
export interface BulkAction<T extends ListItem> {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onAction: (selectedItems: T[]) => void;
}

// --- Component Props ---

export interface ListViewProps<T extends ListItem> {
  data: T[];
  columns: ListColumn<T>[];
  bulkActions?: BulkAction<T>[];
  title: string;
  emptyStateMessage?: string;
}

// --- Helper Components for Sevensa Branding ---

const SevensaHeader: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white rounded-t-lg">
    <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
    <div className="flex space-x-4">{children}</div>
  </div>
);

const SevensaListItem: React.FC<{ children: React.ReactNode; isSelected: boolean; onSelect: () => void }> = ({ children, isSelected, onSelect }) => (
  <div
    className={`flex items-center p-4 border-b border-gray-100 transition-colors duration-150 cursor-pointer \${
      isSelected ? 'bg-blue-50 hover:bg-blue-100' : 'bg-white hover:bg-gray-50'
    }`}
    onClick={onSelect}
    role="row"
    aria-selected={isSelected}
  >
    <div className="w-8 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
      <Checkbox checked={isSelected} onChange={() => onSelect()} aria-label="Select item" />
    </div>
    <div className="flex-grow flex items-center" role="rowgroup">{children}</div>
  </div>
);

// --- Main Component ---

const ListView = <T extends ListItem>({ data, columns, bulkActions = [], title, emptyStateMessage = "No items found." }: ListViewProps<T>) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<{ key: keyof T; direction: 'asc' | 'desc' } | null>(null);
  const [groupBy, setGroupBy] = useState<keyof T | null>(null);

  // --- Data Processing Logic (Search, Sort, Group) ---

  const processedData = useMemo(() => {
    let result = data;

    // 1. Search/Filter Logic
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      result = result.filter(item =>
        Object.values(item).some(value =>
          String(value).toLowerCase().includes(lowerCaseSearchTerm)
        )
      );
    }

    // 2. Sorting Logic
    if (sortBy) {
      result = _.orderBy(result, [sortBy.key as string], [sortBy.direction]);
    }

    return result;
  }, [data, searchTerm, sortBy]);

  const groupedData = useMemo(() => {
    if (!groupBy) {
      return { 'All Items': processedData };
    }
    // 3. Grouping Logic
    return _.groupBy(processedData, item => String(item[groupBy as keyof T]));
  }, [processedData, groupBy]);

  // --- Selection Logic ---

  const toggleSelectItem = useCallback((itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    const allIds = processedData.map(item => item.id);
    if (selectedItems.size === allIds.length && allIds.length > 0) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(allIds));
    }
  }, [processedData, selectedItems.size]);

  const selectedData = useMemo(() => processedData.filter(item => selectedItems.has(item.id)), [processedData, selectedItems]);
  const isAllSelected = selectedItems.size > 0 && processedData.length > 0 && selectedItems.size === processedData.length;
  const hasSelection = selectedItems.size > 0;

  // --- Handlers ---

  const handleSort = (key: keyof T) => {
    setSortBy(prev => {
      if (prev && prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const handleGroupBy = (key: keyof T | null) => {
    setGroupBy(key);
  };

  // --- Render Functions ---

  const renderControls = () => (
    <div className="flex items-center space-x-4">
      {/* Search Input */}
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 h-9 rounded-md border border-gray-300 focus:ring-sevensa-blue focus:border-sevensa-blue"
          aria-label="Search list items"
        />
      </div>

      {/* Sort Dropdown */}
      <DropdownMenu
        items={columns.filter(c => c.sortable).map(column => ({
          id: String(column.key),
          label: `${column.title}${sortBy?.key === column.key ? ` (${sortBy.direction === 'asc' ? 'ASC' : 'DESC'})` : ''}`,
          onClick: () => handleSort(column.key)
        }))}
        trigger={
          <Button variant="outline" className="flex items-center space-x-2">
            <ArrowUpDown className="h-4 w-4" />
            <span>Sort By: {sortBy ? columns.find(c => c.key === sortBy.key)?.title : 'None'}</span>
          </Button>
        }
      />

      {/* Group By Dropdown */}
      <DropdownMenu
        items={[
          {
            id: 'none',
            label: `None${!groupBy ? ' ✓' : ''}`,
            onClick: () => handleGroupBy(null),
          },
          {
            id: 'divider-1',
            label: '',
            type: 'divider' as const
          },
          ...columns.filter(c => c.groupBy).map(column => ({
            id: String(column.key),
            label: `${column.title}${groupBy === column.key ? ' ✓' : ''}`,
            onClick: () => handleGroupBy(column.key)
          }))
        ]}
        trigger={
          <Button variant="outline" className="flex items-center space-x-2">
            <Group className="h-4 w-4" />
            <span>Group By: {groupBy ? columns.find(c => c.key === groupBy)?.title : 'None'}</span>
          </Button>
        }
      />

      {/* Bulk Actions (Conditional Rendering) */}
      {hasSelection && bulkActions.length > 0 && (
        <DropdownMenu
          items={bulkActions.map(action => ({
            id: action.id,
            label: action.label,
            icon: action.icon,
            onClick: () => action.onAction(selectedData as T[])
          }))}
          trigger={
            <Button variant="primary" className="bg-sevensa-blue hover:bg-sevensa-blue/90 text-white">
              {selectedItems.size} Selected
            </Button>
          }
        />
      )}
    </div>
  );

  const renderListHeader = () => (
    <div className="flex items-center p-4 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-500" role="rowheader">
      <div className="w-8 flex-shrink-0">
        <Checkbox
          checked={isAllSelected}
          onChange={toggleSelectAll}
          aria-label="Select all items"
        />
      </div>
      <div className="flex-grow flex items-center">
        {columns.map(column => (
          <div key={String(column.key)} className="flex-1 px-2">
            {column.title}
          </div>
        ))}
      </div>
    </div>
  );

  const renderListItem = (item: T) => {
    const isSelected = selectedItems.has(item.id);
    return (
      <SevensaListItem key={item.id} isSelected={isSelected} onSelect={() => toggleSelectItem(item.id)}>
        {columns.map(column => (
          <div key={String(column.key)} className="flex-1 px-2 truncate" role="cell">
            {column.render(item)}
          </div>
        ))}
      </SevensaListItem>
    );
  };

  const renderListContent = () => {
    if (processedData.length === 0) {
      return (
        <div className="p-8 text-center text-gray-500">
          <ListFilter className="h-8 w-8 mx-auto mb-2" />
          <p className="text-lg font-medium">{emptyStateMessage}</p>
          {searchTerm && <p className="text-sm">Try adjusting your search or filters.</p>}
        </div>
      );
    }

    return (
      <div role="list">
        {Object.entries(groupedData).map(([groupKey, items]) => (
          <React.Fragment key={groupKey}>
            {groupBy && (
              <div className="p-2 px-4 bg-gray-100 text-sm font-semibold text-gray-700 border-b border-gray-200 sticky top-0 z-10" role="group" aria-label={`Group: ${groupKey}`}>
                {columns.find(c => c.key === groupBy)?.title}: {groupKey} ({items.length})
              </div>
            )}
            {items.map(renderListItem)}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <Card className="shadow-lg rounded-lg overflow-hidden border border-gray-200" role="table" aria-label={title}>
      <style jsx global>{`
        /* Sevensa Branding Colors (Placeholder - adjust as needed) */
        .bg-sevensa-blue { background-color: #007bff; }
        .hover\\:bg-sevensa-blue\\/90:hover { background-color: #0069d9; }
        .focus\\:border-sevensa-blue:focus { border-color: #007bff; }
        .focus\\:ring-sevensa-blue:focus { --tw-ring-color: #007bff; }
        .text-sevensa-blue { color: #007bff; }
      `}</style>
      <SevensaHeader title={title}>
        {renderControls()}
      </SevensaHeader>
      
      <div role="rowgroup">
        {renderListHeader()}
      </div>
      
      <div className="max-h-[600px] overflow-y-auto">
        {renderListContent()}
      </div>
    </Card>
  );
};

export default ListView;