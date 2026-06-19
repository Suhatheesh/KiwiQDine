import { FC, useState, useMemo } from 'react';
import { Minus, Plus, Clock, Sparkles, Info } from 'lucide-react';
import { MenuItem } from '../features/Menu/types';
import AddonsListItem from '../components/AddonsListItem';
import { formatPrice } from '../utils';
import placeholder from '../assets/placeholder.png';
import { SelectedAddOn } from '../features/Cart/types';

interface MenuItemDetailSectionProps {
    item: MenuItem;
    onAddToCart: (item: MenuItem, quantity: number, selectedVariants: any[], selectedAddons: SelectedAddOn[], specialInstructions: string) => void;
}

const MenuItemDetailSection: FC<MenuItemDetailSectionProps> = ({ item, onAddToCart }) => {
    const firstVariant = item.variantOptions?.[0];
    const firstOption = firstVariant?.options?.[0];

    const [selectedVariants, setSelectedVariants] = useState<Map<string, string[]>>(() => {
        if (firstVariant && firstOption) {
            return new Map().set(firstVariant.name, [firstOption.name]);
        }
        return new Map();
    });
    const [selectedAddons, setSelectedAddons] = useState<Map<string, SelectedAddOn>>(new Map());
    const [quantity, setQuantity] = useState<number>(1);
    const [specialInstructions, setSpecialInstructions] = useState<string>('');

    const hasDiscount = (item.discount ?? 0) > 0;
    const basePrice = hasDiscount ? item.price * (1 - (item.discount ?? 0) / 100) : Number(item.price);

    const variantPriceModifier = useMemo(() => {
        let modifier = 0;
        if (item.variantOptions && item.variantOptions.flatMap(v => v.options).length > 0) {
            selectedVariants.forEach((options, variantName) => {
                const variant = item.variantOptions?.find(v => v.name === variantName);
                if (variant) {
                    options.forEach(optionName => {
                        const option = variant.options?.find(o => o.name === optionName);
                        if (option?.price) {
                            const variantPrice = hasDiscount
                                ? option.price * (1 - (item.discount ?? 0) / 100)
                                : option.price;
                            modifier += variantPrice;
                        }
                    });
                }
            });
        } else {
            modifier = basePrice;
        }

        // Add addons price
        selectedAddons.forEach((addon) => {
            modifier += addon.unitPrice;
        });

        return modifier;
    }, [selectedVariants, selectedAddons, item.variantOptions, basePrice, hasDiscount, item.discount]);

    const totalPrice = variantPriceModifier * quantity;

    const handleQuantityChange = (delta: 1 | -1) => {
        setQuantity(prev => Math.max(1, prev + delta));
    };

    const handleVariantChange = (variantName: string, optionName: string, type: 'single' | 'multiple') => {
        setSelectedVariants(prev => {
            const newMap = new Map(prev);
            const currentOptions = newMap.get(variantName) || [];

            if (type === 'single') {
                newMap.set(variantName, [optionName]);
            } else {
                if (currentOptions.includes(optionName)) {
                    const filtered = currentOptions.filter(o => o !== optionName);
                    if (filtered.length === 0) {
                        newMap.delete(variantName);
                    } else {
                        newMap.set(variantName, filtered);
                    }
                } else {
                    newMap.set(variantName, [...currentOptions, optionName]);
                }
            }
            return newMap;
        });
    };

    const handleAddonChange = (addonId: string, name: string, price: number) => {
        setSelectedAddons(prev => {
            const newMap = new Map(prev);
            if (newMap.has(addonId)) {
                newMap.delete(addonId);
            } else {
                newMap.set(addonId, {
                    addonId,
                    addonName: name,
                    quantity: 1,
                    totalPrice: price,
                    unitPrice: price,
                    id: addonId,
                });
            }
            return newMap;
        });
    };

    const handleAddToCart = () => {
        const variants = Array.from(selectedVariants.entries()).map(([variantName, options]) => ({
            variantName,
            options: options.map(optionName => {
                const variant = item.variantOptions?.find(v => v.name === variantName);
                const option = variant?.options?.find(o => o.name === optionName);
                return { name: optionName, price: option?.price };
            })
        }));

        const addons = Array.from(selectedAddons.values());

        onAddToCart(item, quantity, variants, addons, specialInstructions);
    };

    return (
        <div className="flex flex-col bg-linear-to-br from-orange-50/50 via-white to-red-50/50 md:rounded-t-2xl shadow-2xl overflow-y-auto max-h-[85vh] pointer-events-auto">

            {/* Content Area */}
            <div className="pb-28">

                {/* Image Section with Badges */}
                <div className="relative h-56 sm:h-64 overflow-hidden mt-2 mx-4">
                    <img
                        src={item.image || placeholder}
                        alt={item.name}
                        className="w-full h-full rounded-3xl object-cover shadow-xl"
                    />

                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent rounded-3xl"></div>

                    {/* Discount badge */}
                    {hasDiscount && (
                        <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-2 bg-linear-to-r from-red-500 to-orange-500 text-white rounded-full text-sm font-bold shadow-lg animate-pulse">
                            <Sparkles className="w-4 h-4" />
                            <span>{item.discount}% OFF</span>
                        </div>
                    )}

                    {/* Availability badge */}
                    {item.isAvailable === false && (
                        <div className="absolute top-4 right-4 px-3 py-2 bg-gray-900/90 backdrop-blur-sm text-white rounded-full text-sm font-semibold shadow-lg">
                            Unavailable
                        </div>
                    )}

                    {/* Preparation time badge */}
                    {item.preparationTime && item.preparationTime > 0 && (
                        <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-2 bg-white/95 backdrop-blur-sm rounded-full text-sm font-medium text-gray-700 shadow-lg">
                            <Clock className="w-4 h-4" />
                            <span>{item.preparationTime} min</span>
                        </div>
                    )}

                    {/* Custom Premium Badges */}
                    {item.badges && item.badges.length > 0 && (
                        <div className="absolute bottom-4 right-4 flex flex-wrap justify-end gap-2 max-w-[70%]">
                            {item.badges.map((badge) => (
                                <div
                                    key={badge.id}
                                    style={{
                                        backgroundColor: `${badge.backgroundColor}EE`,
                                        color: badge.textColor,
                                        borderColor: `${badge.textColor}40`
                                    }}
                                    className="px-3 py-1.5 rounded-xl text-xs font-bold shadow-xl flex items-center gap-1.5 backdrop-blur-xs border transition-transform duration-300 hover:scale-105"
                                >
                                    {badge.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="px-6 py-5 space-y-6">

                    {/* Item Description */}
                    <div className="space-y-3">
                        <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                            {item.name}
                        </h1>

                        {item.description && (
                            <p className="text-gray-400 leading-relaxed text-base">
                                {item.description}
                            </p>
                        )}

                        {/* Price display */}
                        <div className="flex items-baseline gap-2 pt-2">
                            {hasDiscount && (
                                <span className="text-lg text-gray-400 line-through font-medium">
                                    {formatPrice(Number(item.price))}
                                </span>
                            )}
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-gray-600">
                                    {formatPrice(basePrice)}
                                </span>
                            </div>
                        </div>

                        {/* Note */}
                        {item.note && (
                            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                                <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-blue-700 leading-relaxed">{item.note}</p>
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-linear-to-r from-transparent via-gray-200 to-transparent"></div>

                    {/* Quantity Selector */}
                    <div className="flex justify-between items-center py-2">
                        <span className="text-lg font-semibold text-gray-900">Quantity</span>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => handleQuantityChange(-1)}
                                disabled={quantity <= 1}
                                className="w-10 h-10 flex items-center justify-center border-2 border-orange-200 rounded-xl text-orange-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-orange-50 transition-all duration-200 hover:scale-110 active:scale-95"
                            >
                                <Minus className="h-5 w-5" />
                            </button>
                            <span className="text-2xl font-bold text-gray-900 w-12 text-center">{quantity}</span>
                            <button
                                onClick={() => handleQuantityChange(1)}
                                className="w-10 h-10 flex items-center justify-center bg-linear-to-br from-orange-500 via-orange-500 to-orange-500 rounded-xl text-white hover:from-orange-600 hover:via-red-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-110 active:scale-95"
                            >
                                <Plus className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Variant Options (dynamic based on item.variantOptions) */}
                    {item.variantOptions && item.variantOptions.flatMap(v => v.options).length > 0 && (
                        <>
                            <div className="h-px bg-linear-to-r from-transparent via-gray-200 to-transparent"></div>

                            {item.variantOptions.map((variant, index) => (
                                <div key={index} className="space-y-4">
                                    <div className="flex justify-between items-baseline">
                                        <h3 className="text-lg font-semibold text-gray-900">{variant.name}</h3>
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${variant.required ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                                            {variant.required ? 'REQUIRED' : 'OPTIONAL'}
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        {variant.options?.map((option, optIndex) => {
                                            const isSelected = selectedVariants.get(variant.name)?.includes(option.name) || false;
                                            // Apply discount to option price if item has discount
                                            const optionPrice = option.price ?? 0;
                                            const displayPrice = hasDiscount
                                                ? optionPrice * (1 - (item.discount ?? 0) / 100)
                                                : optionPrice;
                                            return (
                                                <AddonsListItem
                                                    key={optIndex}
                                                    isChecked={isSelected}
                                                    type={variant.type}
                                                    label={option.name}
                                                    value={displayPrice}
                                                    originalValue={hasDiscount ? optionPrice : undefined}
                                                    onChange={() => handleVariantChange(variant.name, option.name, variant.type)}
                                                />
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {/* Addons Section */}
                    {item.addons && item.addons.length > 0 && (
                        <>
                            <div className="h-px bg-linear-to-r from-transparent via-gray-200 to-transparent"></div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-baseline">
                                    <h3 className="text-lg font-semibold text-gray-900">Add-ons</h3>
                                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                                        OPTIONAL
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {item.addons && item.addons.length > 0 && item.addons
                                        .map((addon, index) => {
                                            const addonPrice = addon.price;
                                            const isSelected = selectedAddons.has(addon.id);

                                            return (
                                                <AddonsListItem
                                                    key={index}
                                                    isChecked={isSelected}
                                                    type={addon.type}
                                                    label={addon.name}
                                                    value={addonPrice}
                                                    onChange={() => handleAddonChange(addon.id, addon.name, addonPrice)}
                                                />
                                            );
                                        })}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Special Instructions */}
                    <div className="space-y-3 pt-2">
                        <h3 className="text-lg font-semibold text-gray-900">Special Instructions</h3>
                        <textarea
                            value={specialInstructions}
                            onChange={(e) => setSpecialInstructions(e.target.value)}
                            rows={3}
                            placeholder="e.g. no onions, extra pickles, well done..."
                            className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-orange-400 resize-none transition-all duration-200 placeholder-gray-400 text-gray-700"
                        />
                    </div>

                </div>
            </div>

            {/* Sticky Footer Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4  bg-white/95 backdrop-blur-md border-t border-orange-100 md:rounded-b-2xl shadow-2xl">
                <button
                    onClick={handleAddToCart}
                    disabled={item.isAvailable === false}
                    className="w-full text-base bg-linear-to-r from-orange-500 via-orange-500 to-orange-500 hover:from-orange-600 hover:via-red-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95 relative overflow-hidden group"
                >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-linear-to-r from-transparent via-white/20 to-transparent"></div>

                    <span className="relative z-10">
                        {item.isAvailable === false ? 'Currently Unavailable' : `Add to Cart - ${formatPrice(totalPrice)}`}
                    </span>
                </button>
            </div>

        </div>
    );
};

export default MenuItemDetailSection;