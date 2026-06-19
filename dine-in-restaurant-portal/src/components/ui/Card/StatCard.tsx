import { ReactNode } from 'react';
import { Skeleton } from '../Skeleton/Skeleton';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: 'green' | 'blue' | 'orange' | 'red' | 'purple' | 'gray' | 'neutral';
  onClick?: () => void;
  loading?: boolean;
  compact?: boolean;
  className?: string;
}

const gradientBackgrounds = {
  green: 'from-emerald-500 to-emerald-600',
  blue: 'from-blue-500 to-blue-600',
  orange: 'from-amber-500 to-amber-600',
  red: 'from-rose-500 to-rose-600',
  purple: 'from-purple-500 to-purple-600',
  gray: 'from-gray-500 to-gray-600',
  neutral: 'from-gray-500 to-gray-600',
};

export function StatCard({
  label,
  value,
  icon,
  color = 'neutral',
  onClick,
  loading = false,
  compact = false,
  className = '',
}: StatCardProps) {
  if (loading) {
    return (
      <div className={`relative bg-linear-to-br ${gradientBackgrounds[color]} rounded-2xl ${compact ? 'p-4 min-h-[120px]' : 'p-5 min-h-[140px]'} shadow-lg border border-white/10 ${className} overflow-hidden flex flex-col justify-between`}>
        {/* Decorative circular element skeleton */}
        <div className={`absolute -top-6 -right-6 ${compact ? 'w-24 h-24 border-8' : 'w-32 h-32 border-12'} rounded-full border-white/5 opacity-40`}></div>

        {/* Top row: Icon and Badge skeletons */}
        <div className="relative z-10 flex items-start justify-between">
          <Skeleton variant="rectangular" width={compact ? 32 : 40} height={compact ? 32 : 40} className="rounded-xl opacity-20" />
          <Skeleton variant="rectangular" width={compact ? 50 : 60} height={compact ? 18 : 22} className="rounded-full opacity-20" />
        </div>

        {/* Bottom row: Value and Label skeletons */}
        <div className="relative z-10 mt-auto">
          <Skeleton width="70%" height={compact ? 28 : 36} className="opacity-30 mb-2 rounded-lg" />
          <Skeleton width="40%" height={compact ? 12 : 14} className="opacity-20 rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`group relative bg-linear-to-br ${gradientBackgrounds[color]} rounded-2xl ${compact ? 'p-4 min-h-[120px]' : 'p-5 min-h-[140px]'
        } shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden ${onClick ? 'cursor-pointer' : ''
        } ${className} flex flex-col justify-between`}
    >
      {/* Decorative circular element in top right - matches reference image */}
      <div className={`absolute -top-6 -right-6 ${compact ? 'w-24 h-24 border-8' : 'w-32 h-32 border-12'} rounded-full border-white/10 opacity-50 group-hover:scale-110 transition-transform duration-700`}></div>

      {/* Top row: Icon and Badge */}
      <div className={`relative z-10 flex items-start justify-between ${compact ? 'mb-2' : ''}`}>
        {icon && (
          <div className={`${compact ? 'p-2' : 'p-2.5'} rounded-xl bg-white/20 backdrop-blur-md border border-white/20 shadow-inner`}>
            <div className={`text-white ${compact ? '[&>svg]:w-4 [&>svg]:h-4' : '[&>svg]:w-5 [&>svg]:h-5'} [&>svg]:stroke-[2.5]`}>
              {icon}
            </div>
          </div>
        )}
        <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
          <span className="text-[10px] font-black text-white uppercase tracking-widest whitespace-nowrap">
            {label.split(' ')[0]}
          </span>
        </div>
      </div>

      {/* Bottom row: Value and Label */}
      <div className="relative z-10 mt-auto">
        <h3 className={`${compact ? 'text-2xl' : 'text-3xl'} font-black text-white tracking-tight leading-none mb-1.5`}>
          {value}
        </h3>
        <p className={`${compact ? 'text-[10px]' : 'text-[11px]'} font-bold text-white/70 uppercase tracking-widest line-clamp-1`}>
          {label}
        </p>
      </div>
    </div>
  );
}
