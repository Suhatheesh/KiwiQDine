export const MenuSkeleton = () => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-20">
            {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white rounded-3xl overflow-hidden shadow-lg relative border border-orange-100/50 flex flex-col h-full">
                    {/* Shimmer overlay */}
                    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-linear-to-r from-transparent via-white/60 to-transparent z-10"></div>

                    <div className="w-full h-40 sm:h-48 bg-gray-200 relative">
                        <div className="absolute top-3 left-3 w-20 h-6 bg-gray-300 rounded-full"></div>
                    </div>

                    <div className="p-4 sm:p-5 space-y-3 grow flex flex-col">
                        <div className="h-6 bg-gray-200 rounded-lg w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded-lg w-full"></div>
                        <div className="h-4 bg-gray-200 rounded-lg w-5/6"></div>

                        <div className="flex items-center justify-between mt-auto pt-3">
                            <div className="space-y-1.5 w-1/2">
                                <div className="h-3 bg-gray-200 rounded-md w-1/2"></div>
                                <div className="h-8 bg-gray-200 rounded-lg w-full"></div>
                            </div>
                            <div className="h-10 w-10 sm:h-14 sm:w-14 bg-gray-200 rounded-2xl"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const CategorySkeleton = () => {
    return (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
            {[...Array(5)].map((_, index) => (
                <div
                    key={index}
                    className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse shrink-0"
                ></div>
            ))}
        </div>
    );
};