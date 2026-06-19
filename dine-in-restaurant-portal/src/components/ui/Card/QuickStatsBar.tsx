import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { StatCard, StatCardProps } from './StatCard';

export interface QuickStatsBarProps {
  stats: StatCardProps[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
  type?: 'order' | 'cashier';
}

export function QuickStatsBar({
  stats,
  collapsible = true,
  defaultCollapsed = false,
  className = '',
  type = 'order'
}: QuickStatsBarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  if (isCollapsed && collapsible) {
    return (
      <div className={`bg-white border-b border-gray-200 ${className}`}>
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-full px-6 py-2 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <span className="font-medium">Show Statistics</span>
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white border-b border-gray-200 ${className}`}>
      <div className="px-6 py-4">
        {/* Stats Grid */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${type === 'cashier' ? 'xl:grid-cols-3' : 'xl:grid-cols-4'}`}>
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} compact />
          ))}
        </div>

        {/* Collapse Button */}
        {collapsible && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="mt-3 w-full flex items-center justify-center text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            <span className="mr-1">Collapse</span>
            <ChevronUp className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}
