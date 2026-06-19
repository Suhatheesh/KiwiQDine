import { Skeleton } from './Skeleton';

interface CardSkeletonProps {
  variant?: 'kpi' | 'order' | 'default';
  count?: number;
}

export function CardSkeleton({ variant = 'default', count = 1 }: CardSkeletonProps) {
  if (variant === 'kpi') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
        ))}
      </div>
    );
  }

  if (variant === 'order') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <Skeleton width="30%" height={20} className="mb-2" />
                <Skeleton width="50%" height={14} />
              </div>
              <Skeleton width={80} height={28} className="rounded-full" />
            </div>
            <div className="space-y-3">
              <Skeleton width="100%" height={12} />
              <Skeleton width="90%" height={12} />
              <Skeleton width="80%" height={12} />
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <Skeleton width="25%" height={14} />
                <Skeleton width="20%" height={20} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default variant
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <Skeleton width="100%" height={20} className="mb-4" />
          <Skeleton width="100%" height={100} className="mb-4" />
          <Skeleton width="60%" height={16} />
        </div>
      ))}
    </div>
  );
}
