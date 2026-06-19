import { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '../Skeleton/Skeleton';

export interface KPICardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down';
    label?: string;
  };
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray';
  onClick?: () => void;
  loading?: boolean;
  subtitle?: string;
  className?: string;
}

const colorVariants = {
  blue: {
    gradient: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    icon: 'bg-blue-100 text-blue-600',
  },
  green: {
    gradient: 'from-green-500 to-green-600',
    bg: 'bg-green-50',
    text: 'text-green-700',
    icon: 'bg-green-100 text-green-600',
  },
  orange: {
    gradient: 'from-orange-500 to-orange-600',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    icon: 'bg-orange-100 text-orange-600',
  },
  red: {
    gradient: 'from-red-500 to-red-600',
    bg: 'bg-red-50',
    text: 'text-red-700',
    icon: 'bg-red-100 text-red-600',
  },
  purple: {
    gradient: 'from-purple-500 to-purple-600',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    icon: 'bg-purple-100 text-purple-600',
  },
  gray: {
    gradient: 'from-gray-500 to-gray-600',
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    icon: 'bg-gray-100 text-gray-600',
  },
};

export function KPICard({
  title,
  value,
  icon,
  trend,
  color = 'blue',
  onClick,
  loading = false,
  subtitle,
  className = '',
}: KPICardProps) {
  const colorConfig = colorVariants[color];

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Skeleton width="60%" height={14} className="mb-3" />
            <Skeleton width="80%" height={32} />
          </div>
          <Skeleton variant="circular" width={48} height={48} />
        </div>
        <div className="mt-4">
          <Skeleton width="40%" height={12} />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between">
        {/* Left side - Title and Value */}
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className={`text-3xl font-bold ${colorConfig.text}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>

        {/* Right side - Icon */}
        {icon && (
          <div className={`w-12 h-12 rounded-lg ${colorConfig.icon} flex items-center justify-center`}>
            {icon}
          </div>
        )}
      </div>

      {/* Trend indicator */}
      {trend && (
        <div className="mt-4 flex items-center gap-1">
          {trend.direction === 'up' ? (
            <TrendingUp className="w-4 h-4 text-green-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600" />
          )}
          <span
            className={`text-sm font-medium ${
              trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {trend.direction === 'up' ? '+' : '-'}
            {Math.abs(trend.value)}%
          </span>
          {trend.label && <span className="text-sm text-gray-500 ml-1">{trend.label}</span>}
        </div>
      )}
    </div>
  );
}
