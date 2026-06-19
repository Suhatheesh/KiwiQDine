import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Search, ShoppingCart, UtensilsCrossed, RefreshCw, AlertCircle, X, ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import MenuItemCard from '../components/MenuItemCard';
import BottomSheet from '../components/BottomSheet';
import MenuItemDetail from '../sections/MenuItemDetailSection';
import { RootLinks } from '../routers/types';
import { RootState } from '../app/store';
import { fetchMenuRequest, pagination, fetchCategoriesRequest } from '../features/Menu/menuSlice';
import { addCartItemRequest, addItem, fetchCartRequest } from '../features/Cart/cartSlice';
import { MenuItem, MenuFilter } from '../features/Menu/types';
import useRestaurant from '../hooks/useRestaurant';
import { formatPrice } from '../utils';
import { resetOrderState } from '../features/Order/orderSlice';
import { RestaurantType } from '../utils/Constant';
import { resetCustomerState } from '../features/Customer/customerSlice';
import FilterSection from '../sections/FilterSection';
import { MenuSkeleton, CategorySkeleton } from '../components/CustomeSkeletons';

export function Menu() {

    const { restaurantId, restaurantType, setCartSessionId } = useRestaurant();

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const { logo, title } = location.state as { logo: string, title?: string };

    const { error } = useSelector((state: RootState) => state.restaurant);
    const { items: menuItems, categories, pagination: pages, loading, isPaginationLoading } = useSelector((state: RootState) => state.menu);
    const { cartItem, cartResponse } = useSelector((state: RootState) => state.cart);

    const observer = useRef<IntersectionObserver | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All Items');
    const [selectItem, setSelectItem] = useState<MenuItem | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [tempPriceRange, setTempPriceRange] = useState({ min: '', max: '10000' });
    const [filters, setFilters] = useState<MenuFilter>({
        sortBy: '',
        hasDiscount: false,
    });

    useEffect(() => {
        if (restaurantId) {
            dispatch(fetchCategoriesRequest({ restaurantId }));
        }
        if (restaurantType === RestaurantType.FOOD_COURT) {
            dispatch(fetchCartRequest());
        }
        dispatch(resetCustomerState());
    }, [dispatch, restaurantId, restaurantType]);

    useEffect(() => {
        dispatch(pagination(1));
    }, [searchQuery, selectedCategory, filters, dispatch]);

    useEffect(() => {
        if (restaurantId) {
            dispatch(fetchMenuRequest({
                restaurantId,
                filter: {
                    ...filters,
                    search: searchQuery,
                    categoryId: selectedCategory === 'All Items' ? undefined : selectedCategory,
                    page: pages.page,
                    limit: pages.limit
                }
            }));
        }
    }, [restaurantId, filters, searchQuery, selectedCategory, dispatch, pages.page]);

    useEffect(() => {
        if (cartResponse) {
            setCartSessionId(cartResponse.sessionId);
        }
    }, [cartResponse]);

    const allCategories = useMemo(() => {
        return [{ id: 'All Items', name: 'All Items' }, ...new Set(categories?.map((item) => ({ id: item.id, name: item.name })))];
    }, [categories]);

    const filteredItems = useMemo(() => {
        if (!menuItems) return [];
        return menuItems.filter((item) => item.isAvailable);
    }, [menuItems]);

    const handleAddToCartWithVariants = (item: MenuItem, quantity: number, selectedVariants: any[], selectedAddons: any[], specialInstructions: string) => {
        if (restaurantType === RestaurantType.RESTAURANT) {
            dispatch(addItem({
                item,
                quantity,
                selectedVariants,
                selectedAddOns: selectedAddons,
                specialInstructions
            }));
        } else {
            dispatch(addCartItemRequest({
                restaurantId,
                menuId: item.id,
                quantity,
                specialInstructions: {
                    variants: selectedVariants,
                    instructions: specialInstructions
                },
                selectedAddons: selectedAddons.map((addon) => ({
                    addonId: addon.id,
                    quantity: addon.quantity
                })),
            }));
        }
        setSelectItem(null); // Close the bottom sheet
    };

    const handleItemClick = (item: MenuItem) => {
        setSelectItem(item);
    };

    const handleNavigate = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.stopPropagation();
        setSelectItem(null);
        dispatch(resetOrderState());
        navigate(RootLinks.REVIEWORDER);
    };

    const handleRetry = () => {
        dispatch(fetchMenuRequest({ restaurantId, filter: { ...filters, search: searchQuery } }));
    };

    const handleApplyFilters = (filters: MenuFilter) => {
        setFilters(filters);
        setTempPriceRange({
            min: filters.minPrice?.toString() || '',
            max: filters.maxPrice?.toString() || '10000'
        });
        setIsFilterOpen(false);
    };

    const handleClearFilters = () => {
        setFilters({
            sortBy: '',
            hasDiscount: false,
            isTopSelling: false,
            isFeatured: false,
        });
        setTempPriceRange({ min: '', max: '10000' });
    };

    const cartTotal = useMemo(() => {
        return cartItem.reduce((total, item) => total + Number(item.total), 0);
    }, [cartItem]);

    const cartCountItemWise = (itemId: string) => {
        if (restaurantType === RestaurantType.RESTAURANT) {
            return cartItem.reduce((total, item) => {
                if (item.item.id === itemId) {
                    return total + item.qty;
                }
                return total;
            }, 0);
        }
        return cartResponse?.items.reduce((total, item) => {
            if (item.menuId === itemId) {
                return total + item.quantity;
            }
            return total;
        }, 0);
    };

    const lastElementRef = useCallback((node: HTMLDivElement | null) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (isPaginationLoading) return;
            if (entries[0].isIntersecting && pages.page < pages.totalPages) {
                dispatch(pagination(pages.page + 1));
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, pages.page, pages.totalPages, dispatch, isPaginationLoading]);

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-linear-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={handleRetry}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 overflow-hidden">
            <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            {restaurantType === RestaurantType.FOOD_COURT &&
                                <button
                                    onClick={() => navigate(-1)}
                                    className="bg-gray-200 p-2 rounded-full transition-all duration-300 hover:scale-110 active:scale-95  hover:shadow-md group mr-2"
                                    aria-label="Go back"
                                >
                                    <ArrowLeft className="h-5 w-5 text-black transition-colors" />
                                </button>}
                            {logo ? <img src={logo} alt="Logo" className="w-12 h-12 rounded-full" /> : <UtensilsCrossed className="w-5 h-5 text-gray-700" />}
                            <h1 className="text-lg font-bold text-gray-900">
                                {title}
                            </h1>
                        </div>
                    </div>

                    {/* Search and Filter Bar */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search Menu.."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-10 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => setIsFilterOpen(true)}
                            className={`p-3 rounded-xl border transition-all duration-200 relative ${filters.minPrice || filters.maxPrice || filters.hasDiscount || filters.sortBy
                                ? 'bg-blue-50 border-blue-200 text-blue-600'
                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                }`}
                        >
                            <SlidersHorizontal className="w-5 h-5" />
                            {(filters.minPrice || filters.maxPrice || filters.hasDiscount || (filters.sortBy)) && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></span>
                            )}
                        </button>
                    </div>

                    {/* Active Filters HUD */}
                    {(filters.minPrice || filters.maxPrice || filters.hasDiscount || filters.isTopSelling || filters.isFeatured || (filters.sortBy)) && (
                        <div className="flex flex-wrap gap-2 mb-4 animate-fadeIn px-2">
                            {filters.sortBy && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full border border-blue-100 uppercase tracking-tight">
                                    Sort: {filters.sortBy.replace('_', ' ')}
                                    <button onClick={() => setFilters(prev => ({ ...prev, sortBy: '' }))}>
                                        <X className="w-3 h-3 transition-transform hover:scale-125" />
                                    </button>
                                </span>
                            )}
                            {filters.isTopSelling && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 text-xs font-bold rounded-full border border-orange-100 uppercase tracking-tight">
                                    Top Selling
                                    <button onClick={() => setFilters(prev => ({ ...prev, isTopSelling: false }))}>
                                        <X className="w-3 h-3 transition-transform hover:scale-125" />
                                    </button>
                                </span>
                            )}
                            {filters.isFeatured && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full border border-purple-100 uppercase tracking-tight">
                                    Featured
                                    <button onClick={() => setFilters(prev => ({ ...prev, isFeatured: false }))}>
                                        <X className="w-3 h-3 transition-transform hover:scale-125" />
                                    </button>
                                </span>
                            )}
                            {filters.hasDiscount && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-100 uppercase tracking-tight">
                                    Discounts
                                    <button onClick={() => setFilters(prev => ({ ...prev, hasDiscount: false }))}>
                                        <X className="w-3 h-3 transition-transform hover:scale-125" />
                                    </button>
                                </span>
                            )}
                            {(filters.minPrice || filters.maxPrice) && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-700 text-xs font-bold rounded-full border border-slate-100 uppercase tracking-tight">
                                    {filters.minPrice !== undefined ? `Min: ${filters.minPrice}` : ''}
                                    {filters.minPrice !== undefined && filters.maxPrice !== undefined ? ' - ' : ''}
                                    {filters.maxPrice !== undefined ? `Max: ${filters.maxPrice}` : ''}
                                    <button onClick={() => {
                                        setFilters(prev => ({ ...prev, minPrice: undefined, maxPrice: undefined }));
                                        setTempPriceRange({ min: '', max: '10000' });
                                    }}>
                                        <X className="w-3 h-3 transition-transform hover:scale-125" />
                                    </button>
                                </span>
                            )}
                            <button
                                onClick={handleClearFilters}
                                className="text-xs text-red-500 font-bold hover:underline py-1 px-2 uppercase tracking-widest"
                            >
                                Clear All
                            </button>
                        </div>
                    )}

                    {/* Category Pills */}
                    {!categories || categories.length === 0 && loading ? (
                        <CategorySkeleton />
                    ) : (
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                            {allCategories.map((category, index) => (
                                <button
                                    key={index}
                                    onClick={() => setSelectedCategory(category.id ?? 'All Items')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${selectedCategory === category.id
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white text-gray-700 border border-gray-200'
                                        }`}
                                >
                                    {category.name === 'All Items' && <span>🍽️</span>}
                                    <span>
                                        {category.name}
                                        {category.name === 'All Items' && menuItems && `(${menuItems.length})`}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Menu Items Grid with Stagger Animation */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2">
                {loading ? (
                    <MenuSkeleton />
                ) : filteredItems.length === 0 ? (
                    // Enhanced Empty State
                    <div className="text-center py-20 px-4">
                        <div className="max-w-md mx-auto">
                            <div className="relative inline-block mb-6">
                                <div className="absolute inset-0 bg-linear-to-br from-orange-400 to-red-400 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                                <div className="relative bg-linear-to-br from-orange-100 to-red-100 p-8 rounded-full">
                                    <Search className="w-16 h-16 text-orange-500" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">No dishes found</h3>
                            <p className="text-gray-600 mb-6 leading-relaxed">
                                {searchQuery
                                    ? `We couldn't find any dishes matching "${searchQuery}". Try adjusting your search!`
                                    : "No items available in this category right now."}
                            </p>
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-linear-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                                >
                                    <X className="w-5 h-5" />
                                    Clear Search
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-20">
                        {filteredItems.map((item, index) => (
                            <div
                                key={index}
                                className="animate-fadeInUp"
                                style={{
                                    animationDelay: `${index * 50}ms`,
                                    animationFillMode: 'both'
                                }}
                            >
                                <MenuItemCard
                                    item={item}
                                    quantity={cartCountItemWise(item.id) ?? 0}
                                    onItemClick={handleItemClick}
                                    onAddClick={handleItemClick}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Premium Floating Cart Button */}
            {(cartItem.length > 0 || cartResponse && cartResponse?.items.length > 0) && restaurantType === RestaurantType.RESTAURANT && (
                <div className="fixed bottom-6 left-4 right-4 z-50 animate-slide-up">
                    <div className="max-w-4xl mx-auto">
                        <button
                            className="w-full p-1 group flex items-center bg-linear-to-r from-orange-500/90 to-red-600/90 backdrop-blur-md rounded-2xl shadow-2xl hover:shadow-orange-200/50 transition-all duration-300 transform active:scale-95 border border-white/20"
                            onClick={handleNavigate}
                        >
                            <div className="flex-1 flex items-center justify-between px-5 py-4">
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-20 group-hover:opacity-40"></div>
                                        <div className="relative bg-white/20 p-2.5 rounded-xl backdrop-blur-sm border border-white/30">
                                            <ShoppingCart className="w-6 h-6 text-white" />
                                        </div>
                                        <span className="absolute -top-2 -right-2 bg-white text-orange-600 text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center shadow-lg border-2 border-orange-500">
                                            {restaurantType === RestaurantType.RESTAURANT ? cartItem.length : cartResponse?.items.length}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className="text-white/80 text-xs font-bold uppercase tracking-widest leading-none mb-1">
                                            Your Selection
                                        </span>
                                        <span className="text-white font-extrabold text-lg leading-none">
                                            View cart
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-white/90 font-medium text-sm">Total:</span>
                                    <span className="text-white text-xl font-black tabular-nums">
                                        {restaurantType === RestaurantType.RESTAURANT ? formatPrice(cartTotal) : "NZD " + cartResponse?.totalAmount}
                                    </span>
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* Pagination Loading / Footer Area */}
            <div
                ref={lastElementRef}
                className={`py-12 text-center transition-all duration-500 ${(cartItem.length > 0 || cartResponse && cartResponse?.items.length > 0) ? 'pb-32' : 'pb-16'
                    }`}
            >
                {isPaginationLoading ? (
                    <div className="flex flex-col items-center gap-3 animate-pulse">
                        <div className="flex gap-1.5">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }}></div>
                            ))}
                        </div>
                        <span className="text-sm font-bold text-transparent bg-clip-text bg-linear-to-r from-orange-500 to-red-600 uppercase tracking-widest shimmer-text">
                            Cooking more surprises...
                        </span>
                    </div>
                ) : (
                    <div className="group cursor-default">
                        <span className="text-gray-400 font-medium text-sm group-hover:text-gray-600 transition-colors">
                            {pages.page >= pages.totalPages && filteredItems.length > 0
                                ? "You've reached the end of our delicious menu! ✨"
                                : "Keep scrolling for more delicacies ✨"}
                        </span>
                        {pages.page < pages.totalPages && (
                            <div className="mt-2 flex justify-center opacity-40">
                                <div className="w-1 h-8 bg-linear-to-b from-orange-200 to-transparent rounded-full animate-bounce"></div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <BottomSheet isOpen={selectItem !== null} onClose={() => setSelectItem(null)}>
                {selectItem && (
                    <MenuItemDetail item={selectItem} onAddToCart={handleAddToCartWithVariants} />
                )}
            </BottomSheet>

            {/* Filter BottomSheet */}
            <BottomSheet isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)}>
                <FilterSection selectedFilters={filters} selectedPriceRange={tempPriceRange} handleApplyFilters={handleApplyFilters} />
            </BottomSheet>
        </div>
    );
}
