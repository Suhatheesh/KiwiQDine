import { alpha, Box, Grid, Typography } from "@mui/material";
import { Search } from "lucide-react";
import { MenuItemCard } from "../../components/MenuItemCard";
import { FC, useCallback, useMemo, useRef, useState } from "react";
import { CreateMenuItemRequest, MenuItem } from "../../features/menuItems/types";
import { UseFormReset } from "react-hook-form";
import { RootState } from "../../app/store";
import { useSelector } from "react-redux";
import { MenuItemCardSkeleton } from "../../components/CustomSkeleton";
import placeholder from "../../assets/placeholder.png"

interface MenuItemTabProps {
    theme: any;
    categories: { id: string, name: string, image?: string | null; }[];
    reset: UseFormReset<CreateMenuItemRequest>
    handleSearchChange: (value: string) => void;
    searchQuery: string;
    onEdit?: (item: MenuItem) => void;
    onDelete?: (itemId: string) => void
    onAvailability?: (available: boolean, menuId: string) => void;
}

const MenuItemTab: FC<MenuItemTabProps> = ({ theme, categories, handleSearchChange, searchQuery, reset, onEdit, onDelete, onAvailability }) => {

    const { data: menuItems, loading } = useSelector((state: RootState) => state.menuItems)
    const [selectedCategory, setSelectedCategory] = useState<string>(categories[0].id);

    const categoryScrollRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const handleEdit = useCallback((item: MenuItem) => {
        reset({
            name: item.name,
            description: item.description,
            discount: item.discount,
            image: item.image,
            price: item.price,
            preparationTime: item.preparationTime,
            quantityAvailable: item.quantityAvailable,
            categoryId: item.categoryId,
            note: item.note,
            restaurantId: item.restaurantId,
            isAvailable: item.isAvailable,
            variantOptions: item.variantOptions,
            id: item.id,
        });
        if (onEdit) onEdit(item);
    }, [onEdit, reset])

    const handleCategoryClick = useCallback((categoryId: string) => {
        setSelectedCategory(categoryId);
    }, [setSelectedCategory])

    const filteredMenuItems = useMemo(() => {
        return menuItems.filter((item) => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory.length === 0 ? true : selectedCategory.includes(item.category?.id ?? "");
            return matchesSearch && matchesCategory;
        })
    }, [menuItems, searchQuery, selectedCategory]);

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

    return (
        <Box>
            {/* Controls Bar */}
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                mb: 3,
                alignItems: 'stretch'
            }}>

                <Box
                    sx={{
                        display: 'flex',
                        gap: 1.5,
                        overflowX: 'scroll',
                        overflowY: 'hidden',
                        pb: 1,
                        pl: 2,
                        minWidth: 0,
                        scrollBehavior: 'smooth',
                        '&::-webkit-scrollbar': {
                            display: 'none',
                        },
                        msOverflowStyle: 'none',
                        scrollbarWidth: 'none',
                        userSelect: 'none',
                    }}
                    ref={categoryScrollRef}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseLeave}
                    onMouseUp={handleMouseUp}
                    onMouseMove={handleMouseMove}
                >
                    {categories.map((category, index) => {
                        const itemCount = category.id.length <= 0 ? menuItems.length : menuItems.filter((i) => i.categoryId === category.id).length;
                        const isActive = selectedCategory === category.id;
                        return (
                            <div
                                key={index}
                                onClick={() => handleCategoryClick(category.id)}
                                className={`
                                group px-5 py-2.5 rounded-xl font-semibold text-sm cursor-pointer
                                transition-all duration-300 ease-in-out
                                ${isActive
                                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-200 scale-105'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm hover:shadow-md border border-gray-200'
                                    }
                            `}
                            >
                                <span className="flex items-center space-x-2">
                                    <img src={category.image || placeholder} className="h-5 w-5 object-cover rounded-full" />
                                    <span className="whitespace-nowrap">{category.name}</span>
                                    <span className={`
                                    px-2 py-0.5 rounded-full text-xs font-bold
                                    transition-all duration-300
                                    ${isActive
                                            ? 'bg-white/20 text-white'
                                            : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                                        }
                                `}>
                                        {itemCount}
                                    </span>
                                </span>
                            </div>
                        )
                    })}
                </Box>

                {/* Search */}
                <div className="flex space-x-2 rounded-lg items-center">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className=" bg-white w-full pl-10 pr-4 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </Box>

            <div>
                {loading ?
                    <Grid container spacing={3}>
                        {Array.from({ length: 8 }).map((_, index) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={index}>
                                <MenuItemCardSkeleton key={index} />
                            </Grid>
                        ))}
                    </Grid>
                    : (
                        <div>
                            {/* Menu Items Grid */}
                            {filteredMenuItems.length === 0 ? (
                                <Box
                                    sx={{
                                        textAlign: 'center',
                                        py: 8,
                                        px: 3,
                                        borderRadius: 4,
                                        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
                                        border: `2px dashed ${theme.palette.divider}`,
                                    }}
                                >
                                    <Typography variant="h6" color="text.secondary" gutterBottom>
                                        No menu items found
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {searchQuery
                                            ? 'Try adjusting your search or filter criteria'
                                            : categories.length > 0
                                                ? `No items in selected categories`
                                                : 'Add your first menu item to get started'}
                                    </Typography>
                                </Box>
                            ) : (
                                <Grid container spacing={3}>
                                    {filteredMenuItems.map((item) => (
                                        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={item.id}>
                                            <MenuItemCard
                                                item={item}
                                                onEdit={handleEdit}
                                                onDelete={onDelete}
                                                onToggleAvailability={(id, value) => onAvailability && onAvailability(value, id)}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </div>
                    )}
            </div>
        </Box>
    );
};

export default MenuItemTab;