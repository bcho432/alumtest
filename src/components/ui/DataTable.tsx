'use client';

import React, { ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
  className?: string;
  onRowClick?: (item: T) => void;
  sortable?: boolean;
  onSort?: (column: keyof T) => void;
  sortColumn?: keyof T;
  sortDirection?: 'asc' | 'desc';
}

/**
 * A reusable data table component that handles loading states and empty data
 */
export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyMessage = 'No data available',
  loadingMessage = 'Loading data...',
  className = '',
  onRowClick,
  sortable = false,
  onSort,
  sortColumn,
  sortDirection,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <Icon name="loading" className="h-10 w-10 mx-auto animate-spin text-indigo-600" />
        <p className="mt-2 text-gray-500">{loadingMessage}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <Icon name="empty" className="h-10 w-10 mx-auto text-gray-400" />
        <p className="mt-2 text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  const handleSort = (column: keyof T) => {
    if (sortable && onSort) {
      onSort(column);
    }
  };

  return (
    <div className={`overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg ${className}`}>
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => {
              const isSortable = sortable && typeof column.accessor === 'string';
              const isSorted = isSortable && column.accessor === sortColumn;
              
              return (
                <th
                  key={index}
                  scope="col"
                  className={`py-3.5 text-left text-sm font-semibold text-gray-900 ${
                    index === 0 ? 'pl-4 pr-3 sm:pl-6' : 'px-3'
                  } ${column.className || ''} ${
                    isSortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => isSortable && handleSort(column.accessor as keyof T)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {isSorted && (
                      <Icon
                        name={sortDirection === 'asc' ? 'arrow-up' : 'arrow-down'}
                        className="h-4 w-4"
                      />
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              onClick={() => onRowClick?.(item)}
              className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
            >
              {columns.map((column, columnIndex) => {
                // Handle both function accessors and key accessors
                const cellContent: ReactNode = typeof column.accessor === 'function'
                  ? column.accessor(item)
                  : item[column.accessor as keyof T] as ReactNode;
                
                return (
                  <td
                    key={columnIndex}
                    className={`whitespace-nowrap py-4 text-sm ${
                      columnIndex === 0
                        ? 'pl-4 pr-3 font-medium text-gray-900 sm:pl-6'
                        : 'px-3 text-gray-500'
                    } ${column.className || ''}`}
                  >
                    {cellContent}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 