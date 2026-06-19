import { Check, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { MenuFilter } from "../features/Menu/types";

interface FilterSectionProps {
    selectedFilters: MenuFilter;
    selectedPriceRange: { min: string; max: string };
    handleApplyFilters: (filters: MenuFilter) => void;
}

const FilterSection = ({ selectedFilters, selectedPriceRange, handleApplyFilters }: FilterSectionProps) => {

    const [filters, setFilters] = useState<MenuFilter>(selectedFilters);
    const [tempPriceRange, setTempPriceRange] = useState(selectedPriceRange);

    useEffect(() => {
        setFilters(selectedFilters);
        setTempPriceRange(selectedPriceRange);

    }, [selectedFilters, selectedPriceRange]);

    const handleClearFilters = () => {
        setFilters({
            sortBy: '',
            hasDiscount: false,
            isTopSelling: false,
            isFeatured: false,
        });
        setTempPriceRange({ min: '', max: '10000' });
        onhandleApplyFilters(true);
    };

    const onhandleApplyFilters = (isReset?: boolean) => {
        if (isReset) {
            const updatedFilters = { ...filters, minPrice: undefined, maxPrice: undefined };
            handleApplyFilters(updatedFilters);
            return;
        }
        const updatedFilters = { ...filters, minPrice: Number(tempPriceRange.min), maxPrice: Number(tempPriceRange.max) };
        handleApplyFilters(updatedFilters);
    };

    return (
        <div className="p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Filters</h2>
                <button
                    onClick={handleClearFilters}
                    className="text-sm text-red-500 font-bold hover:underline py-1 px-2 uppercase"
                >
                    Reset
                </button>
            </div>

            <div className="space-y-5">
                {/* Sort By Section */}
                <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase mb-2">
                        Sort By
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { id: 'best_match', label: 'Best Match' },
                            { id: 'price_asc', label: 'Price: Low to High' },
                            { id: 'price_desc', label: 'Price: High to Low' },
                        ].map((option) => (
                            <button
                                key={option.id}
                                onClick={() => setFilters(prev => ({ ...prev, sortBy: option.id as any }))}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${filters.sortBy === option.id
                                    ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500'
                                    : 'bg-white border-gray-100 text-gray-600'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span>{option.label}</span>
                                    {filters.sortBy === option.id && <Check className="w-3 h-3" />}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Separator */}
                <div className="h-px bg-gray-100 w-full" />

                {/* Price Range Section with Dual Slider */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Price Range</h3>
                        <div className="flex items-center gap-2 px-2 py-0.5 bg-gray-100 rounded-full text-[9px] font-black text-gray-500 uppercase">
                            <span>{tempPriceRange.min || 0}</span>
                            <span>-</span>
                            <span>{tempPriceRange.max || 10000}</span>
                        </div>
                    </div>

                    <div className="px-2 pt-4 pb-1">
                        <div className="relative h-1.5 w-full bg-gray-200 rounded-full">
                            {/* Selected Range Track */}
                            <div
                                className="absolute h-full bg-blue-500 rounded-full"
                                style={{
                                    left: `${(Number(tempPriceRange.min || 0) / 10000) * 100}%`,
                                    right: `${100 - (Number(tempPriceRange.max || 10000) / 10000) * 100}%`
                                }}
                            ></div>

                            {/* Dual Range Inputs */}
                            <input
                                type="range"
                                min="0"
                                max="10000"
                                step="100"
                                value={tempPriceRange.min || 0}
                                onChange={(e) => {
                                    const value = Math.min(Number(e.target.value), Number(tempPriceRange.max || 10000) - 500);
                                    setTempPriceRange(prev => ({ ...prev, min: value.toString() }));
                                }}
                                className="absolute inset-0 w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:scale-110 active:[&::-webkit-slider-thumb]:scale-95 transition-all"
                            />
                            <input
                                type="range"
                                min="0"
                                max="10000"
                                step="100"
                                value={tempPriceRange.max || 10000}
                                onChange={(e) => {
                                    const value = Math.max(Number(e.target.value), Number(tempPriceRange.min || 0) + 500);
                                    setTempPriceRange(prev => ({ ...prev, max: value.toString() }));
                                }}
                                className="absolute inset-0 w-full h-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md hover:[&::-webkit-slider-thumb]:scale-110 active:[&::-webkit-slider-thumb]:scale-95 transition-all"
                            />
                        </div>
                        <div className="flex justify-between mt-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                            <span>0</span>
                            <span>5k</span>
                            <span>10k+</span>
                        </div>
                    </div>
                </div>

                {/* Separator */}
                <div className="h-px bg-gray-100 w-full" />

                {/* Quick Selection Grid - Compacted */}
                <div className="space-y-3">
                    <h3 className="text-xs font-black text-gray-400 uppercase">
                        Quick Filters
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        {/* Top Selling */}
                        <button
                            onClick={() => setFilters(prev => ({
                                ...prev,
                                isTopSelling: !prev.isTopSelling,
                                isFeatured: !prev.isTopSelling ? false : prev.isFeatured
                            }))}
                            className={`p-3 rounded-2xl border transition-all duration-300 flex items-center gap-3 relative overflow-hidden ${filters.isTopSelling
                                ? 'bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-500'
                                : 'bg-white border-gray-100 text-gray-600'
                                }`}
                        >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${filters.isTopSelling ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-400'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <span className="font-bold text-sm">Top Selling</span>
                        </button>

                        {/* Featured */}
                        <button
                            onClick={() => setFilters(prev => ({
                                ...prev,
                                isFeatured: !prev.isFeatured,
                                isTopSelling: !prev.isFeatured ? false : prev.isTopSelling
                            }))}
                            className={`p-3 rounded-2xl border transition-all duration-300 flex items-center gap-3 relative overflow-hidden ${filters.isFeatured
                                ? 'bg-purple-50 border-purple-500 text-purple-700 ring-1 ring-purple-500'
                                : 'bg-white border-gray-200 text-gray-600'
                                }`}
                        >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${filters.isFeatured ? 'bg-purple-500 text-white' : 'bg-purple-50 text-purple-400'}`}>
                                <Sparkles className="w-5 h-5 fill-current" />
                            </div>
                            <span className="font-bold text-sm">Featured</span>
                        </button>

                        {/* Discounts */}
                        <button
                            onClick={() => setFilters(prev => ({ ...prev, hasDiscount: !prev.hasDiscount }))}
                            className={`col-span-2 p-3 rounded-2xl border transition-all duration-300 flex items-center gap-3 relative overflow-hidden ${filters.hasDiscount
                                ? 'bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500'
                                : 'bg-white border-gray-200 text-gray-600'
                                }`}
                        >
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${filters.hasDiscount ? 'bg-green-500 text-white' : 'bg-green-50 text-green-400'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="font-bold text-sm">Offers & Discounts</span>
                            </div>
                            {filters.hasDiscount && (
                                <div className="ml-auto">
                                    <Check className="w-4 h-4" />
                                </div>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-6">
                <button
                    onClick={() => onhandleApplyFilters()}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    Apply Filters
                </button>
            </div>
        </div>
    );
};

export default FilterSection;
