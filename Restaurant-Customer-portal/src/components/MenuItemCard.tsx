import { FC } from "react";
import { MenuItem } from "../features/Menu/types";
import { Plus, Clock, Sparkles } from "lucide-react";
import placeholder from '../assets/placeholder.png';

interface MenuItemCardProp {
    item: MenuItem;
    quantity: number;
    onItemClick?: (item: MenuItem) => void;
    onAddClick?: (item: MenuItem) => void;
}

const MenuItemCard: FC<MenuItemCardProp> = ({ item, quantity, onAddClick, onItemClick }) => {

    const hasDiscount = (item.discount ?? 0) > 0;
    const discountedPrice = hasDiscount ? item.price * (1 - (item.discount ?? 0) / 100) : item.price;

    const handleAdd = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.stopPropagation();
        if (onAddClick) {
            onAddClick(item);
        }
    };

    return (
        <div
            key={item.id}
            className="flex flex-col cursor-pointer group h-full"
            onClick={() => onItemClick && onItemClick(item)}
        >
            {/* Glassmorphic card with gradient border */}
            <div className="relative bg-linear-to-br from-white via-white to-orange-50/30 rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 group-hover:scale-[1.03] border border-orange-100/50 h-full flex flex-col">

                {/* Gradient overlay border effect */}
                <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-linear-to-br from-orange-200/20 via-transparent to-red-200/20"></div>

                {/* Image section with badges */}
                <div className="relative overflow-hidden">
                    {/* Image with zoom and brightness effect */}
                    <img
                        src={item.image || placeholder}
                        alt={item.name}
                        className="w-full h-40 sm:h-48 object-cover transition-all duration-500 group-hover:scale-110 group-hover:brightness-110"
                    />

                    {/* Gradient overlay on image */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-300"></div>

                    {/* Discount badge */}
                    {hasDiscount && (
                        <div className="absolute top-3 left-3 flex items-center gap-1 px-3 py-1.5 bg-linear-to-r from-red-500 to-orange-500 text-white rounded-full text-xs font-bold shadow-lg animate-pulse">
                            <Sparkles className="w-3 h-3" />
                            <span>{item.discount}% OFF</span>
                        </div>
                    )}

                    {/* Availability badge */}
                    {item.isAvailable === false && (
                        <div className="absolute top-3 right-3 px-3 py-1.5 bg-gray-900/80 backdrop-blur-sm text-white rounded-full text-xs font-semibold">
                            Unavailable
                        </div>
                    )}

                    {/* Preparation time badge */}
                    {item.preparationTime && item.preparationTime > 0 && (
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-gray-700 shadow-md">
                            <Clock className="w-3 h-3" />
                            <span>{item.preparationTime} min</span>
                        </div>
                    )}

                    {/* Custom Premium Badges */}
                    {item.badges && item.badges.length > 0 && (
                        <div className="absolute bottom-10 right-3 flex flex-wrap justify-end gap-1 max-w-[70%]">
                            {item.badges.map((badge, index) => (
                                <div
                                    key={index}
                                    style={{
                                        backgroundColor: `${badge.backgroundColor}EE`,
                                        color: badge.textColor,
                                        borderColor: `${badge.textColor}40`
                                    }}
                                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-lg flex items-center gap-1 backdrop-blur-xs border transition-transform duration-300 hover:scale-105"
                                >
                                    {badge.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Content section */}
                <div className="p-4 sm:p-5 flex flex-col gap-2.5 grow">
                    {/* Title */}
                    <h3 className="font-bold text-gray-900 text-base sm:text-lg line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors duration-300">
                        {item.name}
                    </h3>

                    {/* Description */}
                    {item.description && (
                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed">
                            {item.description}
                        </p>
                    )}

                    {/* Price and Add button section */}
                    <div className="flex items-center justify-between mt-auto pt-3">
                        {/* Price section */}
                        <div className="flex flex-col gap-0.5">
                            {hasDiscount && (
                                <span className="text-xs text-gray-400 line-through font-medium">
                                    NZD{Number(item.price).toFixed(2)}
                                </span>
                            )}
                            <div className="flex items-baseline gap-1">
                                <span className="text-sm sm:text-base font-semibold text-gray-700">NZD</span>
                                <span className="text-sm sm:text-2xl font-bold bg-linear-to-r from-orange-600 via-red-500 to-pink-500 bg-clip-text text-transparent">
                                    {Number(discountedPrice).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Add button with animated ripple effect */}
                        <button
                            onClick={handleAdd}
                            disabled={item.isAvailable === false}
                            className="relative w-8 h-8 sm:w-14 sm:h-14 flex items-center justify-center bg-linear-to-br from-orange-500 via-red-500 to-pink-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95 group/btn overflow-hidden"
                        >
                            {/* Ripple effect on hover */}
                            <div className="absolute inset-0 bg-white/20 rounded-2xl scale-0 group-hover/btn:scale-100 transition-transform duration-500"></div>

                            {quantity <= 0 ? (
                                <Plus className="w-6 h-6 sm:w-7 sm:h-7 relative z-10 transition-transform duration-300 group-hover/btn:rotate-90" />
                            ) : (
                                <p className="text-lg font-semibold p-4">{quantity}</p>
                            )}

                            {/* Glow effect */}
                            <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-orange-400/50 to-pink-400/50 blur-md opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 -z-10"></div>
                        </button>
                    </div>

                    {/* Note section (if exists) */}
                    {item.note && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-500 italic line-clamp-1">
                                {item.note}
                            </p>
                        </div>
                    )}
                </div>

                {/* Shimmer effect on hover */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-linear-to-r from-transparent via-white/10 to-transparent pointer-events-none"></div>
            </div>
        </div>
    );
};

export default MenuItemCard;