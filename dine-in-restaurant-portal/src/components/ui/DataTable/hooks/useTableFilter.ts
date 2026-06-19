import { useState, useMemo, useCallback } from 'react';

export type FilterPredicate<T> = (item: T) => boolean;

export interface FilterConfig<T> {
  key: string;
  predicate: FilterPredicate<T>;
}

export function useTableFilter<T>(data: T[]) {
  const [filters, setFilters] = useState<Map<string, FilterPredicate<T>>>(new Map());

  const addFilter = useCallback((key: string, predicate: FilterPredicate<T>) => {
    setFilters(prev => new Map(prev).set(key, predicate));
  }, []);

  const removeFilter = useCallback((key: string) => {
    setFilters(prev => {
      const newFilters = new Map(prev);
      newFilters.delete(key);
      return newFilters;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(new Map());
  }, []);

  const filteredData = useMemo(() => {
    if (filters.size === 0) return data;

    return data.filter(item => {
      return Array.from(filters.values()).every(predicate => predicate(item));
    });
  }, [data, filters]);

  return {
    filters,
    filteredData,
    addFilter,
    removeFilter,
    clearFilters,
    activeFilterCount: filters.size,
  };
}
