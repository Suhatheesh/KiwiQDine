import { CircularProgress } from '@mui/material';
import { ReactNode, useState, useMemo, useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
  width?: string;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  height?: number;
  isLoading?: boolean;
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;
  stickyHeader?: boolean;
  zebraStripes?: boolean;
  hoverEffect?: boolean;
  rowClassName?: (item: T, index: number) => string;
  selectedRowKey?: string;
  getRowKey?: (item: T, index: number) => string | number;
  // Pagination props
  pagination?: boolean;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
}

export function EnhancedDataTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  emptyMessage = 'No data available',
  height = 600,
  isLoading = false,
  selectable = false,
  onSelectionChange,
  stickyHeader = true,
  hoverEffect = true,
  rowClassName,
  getRowKey = (_, index) => index,
  pagination = false,
  defaultPageSize = 10,
  pageSizeOptions = [5, 10, 20, 50, 100],
}: DataTableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Handle row selection
  const handleRowClick = useCallback((item: T) => {
    onRowClick?.(item);
  }, [onRowClick]);

  // Handle checkbox selection
  const handleCheckboxChange = useCallback((item: T, index: number) => {
    const rowKey = getRowKey(item, index);
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowKey)) {
        newSet.delete(rowKey);
      } else {
        newSet.add(rowKey);
      }

      // Notify parent of selection change
      if (onSelectionChange) {
        const selectedItems = data.filter((_, i) => newSet.has(getRowKey(data[i], i)));
        onSelectionChange(selectedItems);
      }

      return newSet;
    });
  }, [data, getRowKey, onSelectionChange]);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
      onSelectionChange?.([]);
    } else {
      const allKeys = new Set(data.map((item, i) => getRowKey(item, i)));
      setSelectedRows(allKeys);
      onSelectionChange?.(data);
    }
  }, [data, selectedRows.size, getRowKey, onSelectionChange]);

  // Handle sorting
  const handleSort = useCallback((columnKey: string) => {
    setSortConfig(current => {
      if (!current || current.key !== columnKey) {
        return { key: columnKey, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key: columnKey, direction: 'desc' };
      }
      return null;
    });
  }, []);

  // Sorted data
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue === bValue) return 0;

      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortConfig]);

  // Pagination calculations
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = pagination ? sortedData.slice(startIndex, endIndex) : sortedData;

  // Reset to page 1 when data changes
  useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Page change handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  // Render sort icon
  const renderSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc'
      ? <ChevronUp className="w-4 h-4 text-primary-600" />
      : <ChevronDown className="w-4 h-4 text-primary-600" />;
  };

  const isAllSelected = selectedRows.size === paginatedData.length && paginatedData.length > 0;
  const isSomeSelected = selectedRows.size > 0 && selectedRows.size < paginatedData.length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <div style={{ height }} className="overflow-y-auto relative">
          <table className="min-w-full divide-y divide-gray-200">
            {/* Table Header */}
            <thead
              className={`bg-gray-50 border-b-2 border-gray-200 ${stickyHeader ? 'sticky top-0 z-10 shadow-sm' : ''
                }`}
            >
              <tr>
                {/* Selection checkbox column */}
                {selectable && (
                  <th className="px-4 py-3.5 bg-gray-50">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={input => {
                        if (input) input.indeterminate = isSomeSelected;
                      }}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                  </th>
                )}

                {/* Column headers */}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-3.5 text-[11px] font-bold text-gray-600 uppercase tracking-wider whitespace-nowrap bg-gray-50 ${column.sortable ? 'cursor-pointer select-none hover:bg-gray-100 transition-colors' : ''
                      } ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}`}
                    style={{ width: column.width }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className={`flex items-center gap-2 ${column.align === 'center' ? 'justify-center' : column.align === 'right' ? 'justify-end' : 'justify-start'
                      }`}>
                      <span>{column.label}</span>
                      {column.sortable && renderSortIcon(column.key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-gray-100 bg-white">
              {isLoading ? (
                <tr style={{ height: height - 60 }}>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="px-6 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center justify-center gap-3">
                      <CircularProgress size={40} />
                      <span className="text-sm text-gray-600">Loading data...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr style={{ height: height - 60 }}>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0)}
                    className="px-6 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center justify-center gap-3 py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">{emptyMessage}</p>
                        <p className="text-xs text-gray-500 mt-1">Try adjusting your filters or search query</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, index) => {
                  const rowKey = getRowKey(item, index);
                  const isChecked = selectedRows.has(rowKey);

                  // Custom row className
                  const customRowClass = rowClassName?.(item, index) || '';

                  return (
                    <tr
                      key={rowKey}
                      onClick={() => handleRowClick(item)}
                      className={`transition-all duration-150 ${customRowClass} ${onRowClick ? 'cursor-pointer' : ''
                        } ${hoverEffect && 'hover:bg-gray-100/60'
                        }`}
                    >
                      {/* Selection checkbox */}
                      {selectable && (
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleCheckboxChange(item, index)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                          />
                        </td>
                      )}

                      {/* Data cells */}
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={`px-6 py-4 text-sm whitespace-nowrap ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'} ${column.className || ''
                            }`}
                        >
                          <div
                            className={customRowClass}
                          >
                            {column.render ? column.render(item) : item[column.key]}
                          </div>
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

      {/* Premium Pagination UI */}
      {pagination && totalItems > 0 && (
        <div className="border-t border-gray-200 bg-linear-to-r from-gray-50 to-white px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Items info */}
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <span className="font-medium">
                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} items
              </span>

              {/* Page size selector */}
              <div className="flex items-center gap-2 ml-4">
                <label className="text-gray-600 font-medium">Show:</label>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white hover:border-gray-400 transition-colors cursor-pointer"
                >
                  {pageSizeOptions.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Page navigation */}
            <div className="flex items-center gap-2">
              {/* First page */}
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                  }`}
                title="First page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>

              {/* Previous page */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                  }`}
                title="Previous page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`min-w-[40px] px-3 py-2 rounded-lg text-sm font-semibold transition-all ${currentPage === pageNum
                        ? 'bg-linear-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200 scale-105'
                        : 'text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Next page */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === totalPages
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                  }`}
                title="Next page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Last page */}
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === totalPages
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                  }`}
                title="Last page"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
