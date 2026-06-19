import { X } from 'lucide-react';

export interface ActiveFilter {
  key: string;
  label: string;
  value: string;
}

export interface ActiveFiltersProps {
  filters: ActiveFilter[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
  className?: string;
}

export function ActiveFilters({
  filters,
  onRemove,
  onClearAll,
  className = '',
}: ActiveFiltersProps) {
  if (filters.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-sm font-medium text-gray-700">Active Filters:</span>

      {filters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onRemove(filter.key)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-100 transition-colors group"
        >
          <span>
            {filter.label}: {filter.value}
          </span>
          <X className="w-3.5 h-3.5 group-hover:text-primary-900" />
        </button>
      ))}

      <button
        onClick={onClearAll}
        className="text-sm text-gray-500 hover:text-gray-700 font-medium underline"
      >
        Clear All
      </button>
    </div>
  );
}
