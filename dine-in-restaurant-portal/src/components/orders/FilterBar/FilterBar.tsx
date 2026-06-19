import { ReactNode } from 'react';
import { Search, X } from 'lucide-react';

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface FilterBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  children?: ReactNode;
  className?: string;
}

export function FilterBar({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search orders...',
  children,
  className = '',
}: FilterBarProps) {
  return (
    <div className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="px-6 py-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            placeholder={searchPlaceholder}
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange?.('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Custom Filter Content */}
        {children}
      </div>
    </div>
  );
}
