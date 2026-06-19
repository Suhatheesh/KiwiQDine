import { Skeleton } from './Skeleton';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  height?: number;
}

export function TableSkeleton({
  rows = 5,
  columns = 5,
  showHeader = true,
  height = 500,
}: TableSkeletonProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <div style={{ height }} className="overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            {/* Header Skeleton */}
            {showHeader && (
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {Array.from({ length: columns }).map((_, i) => (
                    <th key={i} className="px-6 py-4">
                      <Skeleton width="80%" height={12} />
                    </th>
                  ))}
                </tr>
              </thead>
            )}

            {/* Body Skeleton */}
            <tbody className="divide-y divide-gray-200 bg-white">
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  {Array.from({ length: columns }).map((_, colIndex) => (
                    <td key={colIndex} className="px-6 py-4">
                      <Skeleton
                        width={colIndex === 0 ? '60%' : '90%'}
                        height={16}
                        animation="wave"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
