import React from 'react';

const SkeletonOrderCard: React.FC = () => {
    return (
        <div className="w-full bg-white border border-gray-200 rounded-xl p-4 animate-pulse">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                    {/* Order Number and Status Skeleton */}
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-16 bg-gray-200 rounded"></div>
                        <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                    </div>

                    {/* Date and Time Skeleton */}
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                        <div className="h-4 w-32 bg-gray-200 rounded"></div>
                    </div>

                    {/* Items Count Skeleton */}
                    <div className="h-4 w-24 bg-gray-200 rounded"></div>
                </div>

                {/* Amount and Arrow Skeleton */}
                <div className="flex items-center gap-2">
                    <div className="h-6 w-16 bg-gray-200 rounded"></div>
                    <div className="h-5 w-5 bg-gray-200 rounded"></div>
                </div>
            </div>
        </div>
    );
};

export default SkeletonOrderCard;
