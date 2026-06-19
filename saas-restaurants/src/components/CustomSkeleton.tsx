import { Skeleton } from "@mui/material";

export const SubscriptionCardSkeleton = () => (
    <div className={`bg-white rounded-xl shadow-sm border-2 transition-all hover:shadow-lg border-gray-200`}>
        <div className='p-6'>
            <div className="flex items-start justify-between mb-4">
                <div>
                    <Skeleton width={100} height={50} />
                    <Skeleton width={50} />
                </div>
                <Skeleton width={20} height={35} />
            </div>
            <Skeleton width={200} />
            <div className="mb-6 mt-0">
                <div className="flex items-baseline -mb-2">
                    <Skeleton width={170} height={80} />
                </div>
                <Skeleton width={150} />
            </div>
            <div className="space-y-3 mb-6">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-2">
                        <Skeleton width={15} />
                        <Skeleton width={150} />
                    </div>
                ))}
            </div>
            <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Skeleton width={35} />
                        <Skeleton width={55} height={30} />
                    </div>
                    <div>
                        <Skeleton width={35} />
                        <Skeleton width={55} height={30} />
                    </div>
                </div>
            </div>
        </div>
    </div>
)

export const MenuItemCardSkeleton = () => (
    <div className="w-[289px] h-[360px] bg-white rounded-xl duration-100 ease-linear shadow border border-gray-200">
        <Skeleton variant="rectangular" width="100%" height="50%" className="rounded-t-xl" />

        <div className="flex h-14 justify-between px-4 pt-2.5 pb-1.5 space-x-2 items-center">
            <Skeleton width="60%" height={24} />
            <Skeleton width={80} height={32} className="rounded-full" />
        </div >

        <div className="flex px-4 space-x-2 items-center mt-2">
            <Skeleton width={60} height={20} />
            <Skeleton width={100} height={20} />
        </div>

        <div className="h-px bg-gray-200 mx-5 my-3" />

        <div className="flex justify-between px-4 items-center">
            <Skeleton width={80} height={24} className="rounded-full" />
            <Skeleton width={40} height={24} />
        </div>

        <div className="flex justify-between px-10 mt-4 pt-2 border-gray-200 border-t">
            <Skeleton width={50} height={20} />
            <div className="w-px h-4 bg-gray-200" />
            <Skeleton width={50} height={20} />
        </div>
    </div >
)

export const CategoryCardSkeleton = () => (
    <div className="flex h-24 bg-gray-100 rounded-lg px-6 items-center justify-between space-x-4 border border-gray-200">
        <div className="flex flex-col space-y-2 w-full">
            <Skeleton width="40%" height={24} />
            <Skeleton width="70%" height={16} />
        </div>
        <Skeleton variant="rectangular" width={20} height={20} />
    </div>
)

export const QRCardSkeleton = () => (
    <div className={`flex flex-col bg-white rounded-xl border border-gray-200 min-h-[280px]`}>
        {/* Header Section */}
        <div className="flex justify-between items-center px-6 pt-5 pb-3">
            <Skeleton width={120} height={40} />
            <Skeleton width={80} height={32} className="rounded-full" />
        </div>

        {/* Details Section - grows to fill space */}
        <div className="px-6 space-y-3 grow">
            <div className="flex items-center space-x-2">
                <Skeleton variant="circular" width={16} height={16} />
                <Skeleton width={60} />
            </div>
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 flex-1">
                    <Skeleton variant="circular" width={16} height={16} />
                    <Skeleton width={150} />
                </div>
                <Skeleton width={40} height={24} />
            </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 my-4 mx-6" />

        {/* Action Buttons - always at bottom */}
    </div>
)

export const DashboardSkeleton = () => {
    return (
        <div className="space-y-8 pb-8">
            {/* Hero Section Skeleton */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 p-8 shadow-xl animate-pulse">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                        <Skeleton width="40%" height={48} sx={{ bgcolor: 'rgba(255, 255, 255, 0.3)' }} />
                        <Skeleton width="60%" height={28} sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)', marginTop: 1 }} />
                    </div>
                    <div className="flex items-center gap-4">
                        <Skeleton width={150} height={44} sx={{ bgcolor: 'rgba(255, 255, 255, 0.3)', borderRadius: '16px' }} />
                        <Skeleton variant="circular" width={44} height={44} sx={{ bgcolor: 'rgba(255, 255, 255, 0.3)' }} />
                    </div>
                </div>
            </div>

            {/* KPI Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <Skeleton width="70%" height={20} />
                                <Skeleton width="90%" height={36} sx={{ marginTop: 1 }} />
                            </div>
                            <Skeleton variant="circular" width={48} height={48} />
                        </div>
                        <Skeleton width="40%" height={20} />
                    </div>
                ))}
            </div>

            {/* Charts Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Revenue Trend Chart Skeleton */}
                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex-1">
                            <Skeleton width="40%" height={28} />
                            <Skeleton width="50%" height={16} sx={{ marginTop: 1 }} />
                        </div>
                        <Skeleton variant="circular" width={48} height={48} />
                    </div>
                    <Skeleton variant="rectangular" width="100%" height={320} sx={{ borderRadius: '12px' }} />
                </div>

                {/* Platform Growth Chart Skeleton */}
                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex-1">
                            <Skeleton width="40%" height={28} />
                            <Skeleton width="50%" height={16} sx={{ marginTop: 1 }} />
                        </div>
                        <Skeleton variant="circular" width={48} height={48} />
                    </div>
                    <Skeleton variant="rectangular" width="100%" height={320} sx={{ borderRadius: '12px' }} />
                </div>

                {/* User Growth Chart Skeleton */}
                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex-1">
                            <Skeleton width="40%" height={28} />
                            <Skeleton width="50%" height={16} sx={{ marginTop: 1 }} />
                        </div>
                        <Skeleton variant="circular" width={48} height={48} />
                    </div>
                    <Skeleton variant="rectangular" width="100%" height={320} sx={{ borderRadius: '12px' }} />
                </div>

                {/* Revenue by Plan Chart Skeleton */}
                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex-1">
                            <Skeleton width="40%" height={28} />
                            <Skeleton width="50%" height={16} sx={{ marginTop: 1 }} />
                        </div>
                        <Skeleton variant="circular" width={48} height={48} />
                    </div>
                    <div className="flex items-center justify-center">
                        <Skeleton variant="circular" width={220} height={220} />
                    </div>
                    <div className="flex justify-center gap-4 mt-6">
                        <Skeleton width={80} height={20} />
                        <Skeleton width={80} height={20} />
                        <Skeleton width={80} height={20} />
                    </div>
                </div>

                {/* Billing Cycles Chart Skeleton */}
                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex-1">
                            <Skeleton width="40%" height={28} />
                            <Skeleton width="50%" height={16} sx={{ marginTop: 1 }} />
                        </div>
                        <Skeleton variant="circular" width={48} height={48} />
                    </div>
                    <div className="flex items-center justify-center">
                        <Skeleton variant="circular" width={220} height={220} />
                    </div>
                    <div className="flex justify-center gap-4 mt-6">
                        <Skeleton width={80} height={20} />
                        <Skeleton width={80} height={20} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export const RestaurantDetailSkeleton = () => (
    <div className="min-h-screen bg-gray-50/50">
        {/* Header Section Skeleton */}
        <div className="relative h-64 w-full bg-gray-200 animate-pulse">
            <div className="absolute top-6 left-6">
                <Skeleton width={180} height={40} style={{ borderRadius: '9999px' }} />
            </div>
        </div>

        {/* Restaurant Info Card Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10 transition-all">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
                    <div className="flex items-start gap-6 w-full">
                        <div className="-mt-12">
                            <Skeleton variant="rectangular" width={96} height={96} style={{ borderRadius: '0.75rem' }} className="shadow-md border-4 border-white" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <Skeleton width={200} height={40} />
                                <Skeleton width={80} height={32} style={{ borderRadius: '9999px' }} />
                                <Skeleton width={120} height={32} style={{ borderRadius: '9999px' }} />
                            </div>
                            <div className="flex flex-wrap items-center gap-4">
                                <Skeleton width={150} height={24} />
                                <Skeleton width={200} height={24} />
                                <Skeleton width={120} height={24} />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Skeleton variant="circular" width={40} height={40} />
                        <Skeleton variant="circular" width={40} height={40} />
                        <Skeleton width={120} height={40} style={{ borderRadius: '0.5rem' }} />
                    </div>
                </div>

                {/* Navigation Tabs Skeleton */}
                <div className="flex items-center gap-6 mt-8 border-b border-gray-100 px-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="pb-3">
                            <Skeleton width={80} height={24} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Skeleton - Generic Placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-64">
                        <Skeleton width="60%" height={28} className="mb-4" />
                        <Skeleton width="100%" height={20} className="mb-2" />
                        <Skeleton width="90%" height={20} className="mb-2" />
                        <Skeleton width="80%" height={20} />
                    </div>
                ))}
            </div>
        </div>
    </div>
);