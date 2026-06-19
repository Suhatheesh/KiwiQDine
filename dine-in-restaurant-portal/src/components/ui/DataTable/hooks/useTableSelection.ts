import { useState, useCallback } from 'react';

export function useTableSelection<T>(
  data: T[],
  getRowKey: (item: T, index: number) => string | number = (_, index) => index
) {
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());

  const toggleRow = useCallback((item: T, index: number) => {
    const rowKey = getRowKey(item, index);
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rowKey)) {
        newSet.delete(rowKey);
      } else {
        newSet.add(rowKey);
      }
      return newSet;
    });
  }, [getRowKey]);

  const toggleAll = useCallback(() => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
    } else {
      const allKeys = new Set(data.map((item, i) => getRowKey(item, i)));
      setSelectedRows(allKeys);
    }
  }, [data, selectedRows.size, getRowKey]);

  const clearSelection = useCallback(() => {
    setSelectedRows(new Set());
  }, []);

  const getSelectedItems = useCallback(() => {
    return data.filter((item, i) => selectedRows.has(getRowKey(item, i)));
  }, [data, selectedRows, getRowKey]);

  const isRowSelected = useCallback((item: T, index: number) => {
    return selectedRows.has(getRowKey(item, index));
  }, [selectedRows, getRowKey]);

  const isAllSelected = selectedRows.size === data.length && data.length > 0;
  const isSomeSelected = selectedRows.size > 0 && selectedRows.size < data.length;

  return {
    selectedRows,
    toggleRow,
    toggleAll,
    clearSelection,
    getSelectedItems,
    isRowSelected,
    isAllSelected,
    isSomeSelected,
    selectedCount: selectedRows.size,
  };
}
