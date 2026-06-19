import { Minus, Plus, Trash2 } from "lucide-react";
import { FC } from "react";
import { formatPrice } from "../utils";
import { CartItem, Item } from "../features/Cart/types";
import useRestaurant from "../hooks/useRestaurant";
import { RestaurantType } from "../utils/Constant";
import placeholder from '../assets/placeholder.png';

type ItemType = CartItem | Item;

interface ReviewOrderItemProps {
    item: ItemType;
    onAddClick?: () => void;
    onMinClick?: () => void;
    onDeleteClick?: () => void;
}

const ReviewOrderItem: FC<ReviewOrderItemProps> = ({ item, onAddClick, onMinClick, onDeleteClick }) => {
    const { restaurantType } = useRestaurant();
    const imageURL = restaurantType === RestaurantType.RESTAURANT ? (item as CartItem).item.image : (item as Item).image;
    const name = restaurantType === RestaurantType.RESTAURANT ? (item as CartItem).item.name : (item as Item).menuName;
    const qty = restaurantType === RestaurantType.RESTAURANT ? (item as CartItem).qty : (item as Item).quantity;
    const total = restaurantType === RestaurantType.RESTAURANT ? (item as CartItem).total : (item as Item).totalPrice;


    const selectedVariants = restaurantType === RestaurantType.RESTAURANT ? (item as CartItem).selectedVariants : (item as Item).specialInstructions?.variants;
    const selectedAddOns = restaurantType === RestaurantType.RESTAURANT ? (item as CartItem).selectedAddOns : (item as Item).selectedAddons;

    const specialInstructions = restaurantType === RestaurantType.RESTAURANT ? (item as CartItem).specialInstructions : (item as Item).specialInstructions?.instructions;

    return (
        <div className="relative group">
            <div className="relative flex items-start gap-3 p-4 border border-gray-200 rounded-2xl bg-white hover:border-orange-200 transition-all duration-300 hover:shadow-md">

                <div className="relative shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 overflow-hidden rounded-xl ring-2 ring-gray-100 group-hover:ring-orange-200 transition-all duration-300">
                        <img
                            src={imageURL || placeholder}
                            alt={name}
                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                        />
                    </div>
                </div>

                {/* Item Details */}
                <div className="flex-1 min-w-0">
                    <div>
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 leading-tight text-base sm:text-lg line-clamp-1">
                                {name}
                            </h3>
                            <button
                                onClick={onDeleteClick}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 group/delete"
                                title="Remove item"
                            >
                                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 group-hover/delete:scale-110 transition-transform" />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        {((selectedVariants && selectedVariants.length > 0) || (selectedAddOns && selectedAddOns.length > 0)) && (
                            <div className="flex flex-col gap-1.5">
                                {selectedVariants && selectedVariants.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {selectedVariants.map((variant: any, idx: number) => (
                                            <div key={idx} className="flex flex-wrap gap-1">
                                                {variant.options?.map((option: any, optIdx: number) => (
                                                    <span
                                                        key={optIdx}
                                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-50 text-orange-700 border border-orange-200"
                                                    >
                                                        {option.name}
                                                    </span>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {selectedAddOns && selectedAddOns.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {selectedAddOns.map((addon: any, idx: number) => (
                                            <span
                                                key={idx}
                                                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200"
                                            >
                                                + {addon.addonName || addon.name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action buttons column */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                            {/* Quantity controls */}
                            <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-1">
                                <button
                                    onClick={onMinClick}
                                    disabled={qty <= 1}
                                    className="w-7 h-7 flex items-center justify-center border-2 border-orange-200 rounded-lg text-orange-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-orange-50 transition-all duration-200 hover:scale-110 active:scale-95 disabled:hover:scale-100"
                                >
                                    <Minus className="h-4 w-4" />
                                </button>

                                <span className="text-base font-bold text-gray-900 w-6 text-center">
                                    {qty}
                                </span>

                                <button
                                    onClick={onAddClick}
                                    className="w-7 h-7 flex items-center justify-center bg-linear-to-br from-orange-500 to-red-500 rounded-lg text-white hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-110 active:scale-95"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        {/* Price with gradient */}
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm sm:text-lg font-bold">
                                {formatPrice(total)}
                            </span>
                        </div>

                        {specialInstructions && (
                            <p className="text-xs text-gray-500 italic mt-1 line-clamp-1">
                                Note: {specialInstructions}
                            </p>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}

export default ReviewOrderItem;