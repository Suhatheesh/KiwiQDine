export interface QuickFilter {
  label: string;
  value: string;
  count?: number;
  color?: string;
}

export interface QuickFiltersProps {
  filters: QuickFilter[];
  activeFilter: string;
  onChange: (value: string) => void;
  className?: string;
}

export function QuickFilters({
  filters,
  activeFilter,
  onChange,
  className = '',
}: QuickFiltersProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {filters.map((filter) => {
        const isActive = activeFilter === filter.value;

        return (
          <button
            key={filter.value}
            onClick={() => onChange(filter.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filter.label}
            {filter.count !== undefined && (
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                }`}
              >
                {filter.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
