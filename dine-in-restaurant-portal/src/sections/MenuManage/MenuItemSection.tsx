import { FC, useCallback, useRef, useState } from "react";
import { CreateMenuItemRequest, MenuItem } from "../../features/menuItems/types";
import { UseFormReset } from "react-hook-form";
import MenuItemCard from "../../components/MenuItemCard";
import { MenuItemCardSkeleton } from "../../components/CustomSkeleton";
import { UserRole } from "../../utils/constants";
import { useSelector } from "react-redux";
import { RootState } from "../../app/store";
import { Search, SearchX } from "lucide-react";
import EmptyState from "../../components/EmptyState";
import { hexToRgba } from "../../utils";
import { useAuth } from "../../hooks/useAuth";
import placeholder from '../../assets/placeholder.png'
import allCategory from '../../assets/all_category.png'
import useAllItemCount from "../../hooks/useAllItemCount";

interface MenuSectionProps {
    categoryId: string
    categoryList: {
        value: string;
        label: string;
        image: string;
        itemCount?: number;
    }[];
    onSearch: (search: string) => void
    onScrollPagination: () => void
    reset: UseFormReset<CreateMenuItemRequest>
    onEdit?: (item: MenuItem) => void;
    onDelete?: (itemId: string) => void
    onCategoryClick?: (id: string) => void
    onAvailability?: (available: boolean, menuId: string) => void;
}

const MenuSection: FC<MenuSectionProps> = ({ categoryId, categoryList, reset, onEdit, onCategoryClick, onDelete, onScrollPagination, onAvailability, onSearch }) => {

    const { primaryColor } = useAuth();
    const { count } = useAllItemCount();
    const menuListRef = useRef<HTMLDivElement>(null);

    const categoryScrollRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const { data: menu, loading, isPaginationFetching } = useSelector((state: RootState) => state.menu)

    const handleScroll = () => {
        if (menuListRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = menuListRef.current;

            if (scrollTop + clientHeight >= scrollHeight - 50) {
                onScrollPagination();
            }
        }
    }

    const handleEdit = useCallback((item: MenuItem) => {
        reset({
            name: item.name,
            description: item.description,
            discount: item.discount,
            image: item.image,
            price: item.price,
            preparationTime: item.preparationTime,
            quantityAvailable: item.quantityAvailable,
            categoryId: item.category?.id,
            note: item.note,
            restaurantId: item.restaurantId,
            isAvailable: item.isAvailable,
            isFeatured: item.isFeatured,
            featuredOrder: item.featuredOrder,
            badges: item.badges?.map(b => b.code) || [],
            variantOptions: item.variantOptions,
            id: item.id,
        });
        if (onEdit) onEdit(item);
    }, [onEdit, reset])

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!categoryScrollRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - categoryScrollRef.current.offsetLeft);
        setScrollLeft(categoryScrollRef.current.scrollLeft);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !categoryScrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - categoryScrollRef.current.offsetLeft;
        const walk = (x - startX) * 2; // scroll-fast
        categoryScrollRef.current.scrollLeft = scrollLeft - walk;
    };

    const handleCategoryClick = (id: string) => {
        onCategoryClick && onCategoryClick(id);
        if (searchRef.current) {
            searchRef.current.value = "";
            onSearch("");
        }
    }

    return (
        <div className="space-y-3" >
            <div
                ref={categoryScrollRef}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                className="flex gap-3 py-2 overflow-x-scroll px-4 cursor-grab active:cursor-grabbing [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] select-none">
                {[{ value: '', label: 'All Items', image: allCategory, itemCount: count }, ...categoryList].map((item, index) => {
                    const isActive = categoryId === item.value;
                    return (
                        <div
                            key={index}
                            onClick={() => handleCategoryClick(item.value)}
                            style={{ background: isActive ? `linear-gradient(to right, ${hexToRgba(primaryColor, 0.8)}, ${hexToRgba(primaryColor, 0.9)})` : "" }}
                            className={`
                                flex items-center gap-3 px-5 py-2.5 rounded-xl font-semibold text-sm cursor-pointer
                                transition-all duration-300 ease-in-out shrink-0
                                ${isActive
                                    ? 'text-white shadow-lg shadow-blue-200 scale-105'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm hover:shadow-md border border-gray-200'
                                }
                            `}
                        >
                            <img src={item.image || placeholder} className="h-5 w-5 object-cover rounded-full" />
                            <span className="whitespace-nowrap">{item.label}</span>
                            <span className={`
                                px-2 py-0.5 rounded-full text-xs font-bold
                                transition-all duration-300
                                ${isActive
                                    ? 'bg-white/20 text-white'
                                    : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                                }
                            `}>
                                {item.itemCount}
                            </span>
                        </div>
                    )
                })}
            </div>

            <div className="flex space-x-2 rounded-lg items-center pb-2">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        ref={searchRef}
                        type="text"
                        placeholder="Search by name or email..."
                        onChange={(e) => onSearch(e.target.value)}
                        className=" bg-white w-full pl-10 pr-4 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>
            {
                loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 grid-flow-row gap-3 space-y-3 h-[calc(100vh-310px)] overflow-scroll pb-4">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <MenuItemCardSkeleton key={index} />
                        ))}
                    </div>
                ) :
                    (
                        <div>
                            {menu.length <= 0 && (
                                <div className="flex flex-1 items-center justify-center">
                                    <EmptyState
                                        icon={SearchX}
                                        iconColor={primaryColor}
                                        title="No items found"
                                        description="We couldn't find any menu items matching your search. Try adjusting your filters or add a new item."
                                    />
                                </div>
                            )}
                            {menu.length > 0 && (
                                <div ref={menuListRef} onScroll={handleScroll} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 grid-flow-row gap-3 space-y-3 h-[calc(100vh-310px)] overflow-y-scroll pb-4">
                                    {menu.map((item, index) => (
                                        <MenuItemCard
                                            key={index}
                                            item={item}
                                            allowedRoles={[UserRole.MANAGER, UserRole.SUPER_ADMIN, UserRole.TENANT_ADMIN]}
                                            onDelete={() => onDelete && onDelete(item.id ?? "")}
                                            onEdit={handleEdit}
                                            onAvailability={onAvailability}
                                        />
                                    ))}

                                    {/* Pagination Loader */}
                                    {isPaginationFetching && (
                                        <div className="col-span-full flex items-center justify-center py-8">
                                            <div className="flex items-center gap-2 text-blue-600">
                                                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                <span className="text-sm font-medium">Loading more items...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
            }
        </div>
    )
}

export default MenuSection;