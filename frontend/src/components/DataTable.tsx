import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { SortState } from '../hooks/useTableSort';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface Props<T> {
  data: T[];
  columns: Column<T>[];
  sort?: SortState | null;
  onSort?: (key: string) => void;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onToggle?: (id: string) => void;
  onToggleAll?: () => void;
  allSelected?: boolean;
  onRowClick?: (item: T) => void;
  getRowId: (item: T) => string;
  emptyMessage?: string;
}

function DataTable<T>({
  data,
  columns,
  sort,
  onSort,
  selectable,
  selectedIds,
  onToggle,
  onToggleAll,
  allSelected,
  onRowClick,
  getRowId,
  emptyMessage = 'No data found',
}: Props<T>) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {selectable && (
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onToggleAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider ${
                    col.sortable ? 'cursor-pointer hover:text-gray-700 select-none' : ''
                  } ${col.className || ''}`}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{col.label}</span>
                    {col.sortable && (
                      <span className="text-gray-400">
                        {sort?.key === col.key ? (
                          sort.direction === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowDown className="w-3.5 h-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => {
                const id = getRowId(item);
                return (
                  <tr
                    key={id}
                    className={`hover:bg-gray-50 transition-colors ${
                      onRowClick ? 'cursor-pointer' : ''
                    } ${selectedIds?.has(id) ? 'bg-primary-50' : ''}`}
                    onClick={() => onRowClick?.(item)}
                  >
                    {selectable && (
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds?.has(id) || false}
                          onChange={() => onToggle?.(id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className={`px-4 py-3 text-sm ${col.className || ''}`}>
                        {col.render
                          ? col.render(item)
                          : String((item as any)[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
