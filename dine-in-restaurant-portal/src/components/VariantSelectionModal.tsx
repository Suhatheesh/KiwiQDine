import { FC, useState, useEffect, useMemo } from 'react';
import { X, Plus, Minus, Check } from 'lucide-react';
import { MenuItem } from '../features/menuItems/types';
import { formatCurrency } from '../utils';
import placeholder from '../assets/placeholder.png';
import { Button } from './Button';
import { SelectedAddOn } from '../features/orders/types';

export interface SelectedVariant {
    variantName: string;
    options: {
        name: string;
        priceModifier?: number;
    }[];
}

interface VariantSelectionModalProps {
    initailSelectedAddOns: SelectedAddOn[];
    isOpen: boolean;
    item: MenuItem | null;
    onClose: () => void;
    onConfirm: (item: MenuItem, quantity: number, selectedVariants: SelectedVariant[], selectedAddOns: SelectedAddOn[]) => void;
}

export const VariantSelectionModal: FC<VariantSelectionModalProps> = ({
    isOpen,
    item,
    onClose,
    onConfirm,
    initailSelectedAddOns
}) => {
    const [quantity, setQuantity] = useState(1);
    const [selections, setSelections] = useState<Map<string, Set<string>>>(new Map());
    const [selectedAddOns, setSelectedAddOns] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (isOpen && item?.variantOptions) {
            // Initialize with default selections
            const defaultSelections = new Map<string, Set<string>>();
            item.variantOptions.forEach((variant) => {
                const defaultOption = variant.options?.find(opt => opt.isDefault);
                if (defaultOption) {
                    defaultSelections.set(variant.name, new Set([defaultOption.name]));
                } else if (variant.type === 'single' && variant.options && variant.options.length > 0) {
                    // Auto-select first option for single-select variants
                    defaultSelections.set(variant.name, new Set([variant.options[0].name]));
                } else {
                    defaultSelections.set(variant.name, new Set());
                }
            });
            setSelections(defaultSelections);
            setQuantity(1);
            setSelectedAddOns(new Set(initailSelectedAddOns.map(addon => addon.addonId)));
        }
    }, [isOpen, item]);

    const handleOptionSelect = (variantName: string, optionName: string, variantType: 'single' | 'multiple') => {
        setSelections(prev => {
            const newSelections = new Map(prev);
            const currentSelection = newSelections.get(variantName) || new Set();

            if (variantType === 'single') {
                // Replace selection for single-select
                newSelections.set(variantName, new Set([optionName]));
            } else {
                // Toggle selection for multi-select
                const newSet = new Set(currentSelection);
                if (newSet.has(optionName)) {
                    newSet.delete(optionName);
                } else {
                    newSet.add(optionName);
                }
                newSelections.set(variantName, newSet);
            }

            return newSelections;
        });
    };

    const handleAddOnToggle = (addonId: string) => {
        setSelectedAddOns(prev => {
            const newSet = new Set(prev);
            if (newSet.has(addonId)) {
                newSet.delete(addonId);
            } else {
                newSet.add(addonId);
            }
            return newSet;
        });
    };

    const isOptionSelected = (variantName: string, optionName: string): boolean => {
        return selections.get(variantName)?.has(optionName) || false;
    };

    const canConfirm = useMemo(() => {
        if (!item?.variantOptions) return true;

        // Check if all required variants have selections
        return item.variantOptions.every(variant => {
            if (!variant.required) return true;
            const selected = selections.get(variant.name);
            return selected && selected.size > 0;
        });
    }, [item, selections]);

    const totalPrice = useMemo(() => {
        if (!item) return 0;

        let modifierTotal = 0;
        if (item.variantOptions && item.variantOptions?.flatMap(variant => variant.options).length > 0) {
            item.variantOptions?.forEach(variant => {
                const selected = selections.get(variant.name);
                if (selected && selected.size > 0) {
                    selected.forEach(optionName => {
                        const option = variant.options?.find(opt => opt.name === optionName);
                        if (option?.price) {
                            // Apply discount to variant option price if item has discount
                            const optionPrice = option.price;
                            const discountedPrice = item.discount && item.discount > 0
                                ? optionPrice - (optionPrice * item.discount / 100)
                                : optionPrice;
                            modifierTotal += discountedPrice;
                        }
                    });
                }
            });
        } else {
            const discountedPrice = item.discount && item.discount > 0
                ? item.price - (item.price * item.discount / 100)
                : item.price;
            modifierTotal += discountedPrice;
        }

        // Add add-ons price (quantity is always 1 per add-on)
        let addOnsTotal = 0;
        selectedAddOns.forEach((addonId) => {
            const menuAddon = item.menuAddons?.find(ma => ma.addonId === addonId);
            if (menuAddon) {
                const price = menuAddon.overridePrice > 0 ? menuAddon.overridePrice : Number(menuAddon.addon.unitPrice);
                addOnsTotal += price;
            }
        });
        return (modifierTotal * quantity) + Number(addOnsTotal);
    }, [item, selections, quantity, selectedAddOns]);

    const handleConfirm = () => {
        if (!item || !canConfirm) return;

        const selectedVariants: SelectedVariant[] = [];
        item.variantOptions?.forEach(variant => {
            const selected = selections.get(variant.name);
            if (selected && selected.size > 0) {
                const options = Array.from(selected).map(optionName => {
                    const option = variant.options?.find(opt => opt.name === optionName);
                    return {
                        name: optionName,
                        price: option?.price
                    };
                });
                selectedVariants.push({
                    variantName: variant.name,
                    options
                });
            }
        });

        // Prepare selected add-ons (quantity is always 1)
        const addOns: SelectedAddOn[] = [];
        selectedAddOns.forEach((addonId) => {
            const menuAddon = item.menuAddons?.find(ma => ma.addonId === addonId);
            if (menuAddon) {
                addOns.push({
                    id: menuAddon.id,
                    addonId: menuAddon.addonId,
                    addonName: menuAddon.addon.name,
                    quantity: 1,
                    unitPrice: menuAddon.overridePrice > 0 ? menuAddon.overridePrice : menuAddon.addon.unitPrice,
                    totalPrice: menuAddon.overridePrice > 0 ? menuAddon.overridePrice : menuAddon.addon.unitPrice
                });
            }
        });

        onConfirm(item, quantity, selectedVariants, addOns);
        onClose();
    };

    if (!isOpen || !item) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
            <div className="flex min-h-screen items-center justify-center p-4">
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300"
                    onClick={onClose}
                />

                <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full animate-scale-in">
                    {/* Header with Image */}
                    <div className="relative h-48 rounded-t-3xl overflow-hidden">
                        <img
                            src={item.image || placeholder}
                            alt={item.name}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-all duration-200 hover:bg-white/20 rounded-full p-2 backdrop-blur-sm"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <div className="absolute bottom-4 left-6 text-white">
                            <h3 className="text-2xl font-bold">{item.name}</h3>
                            {item.description && (
                                <p className="text-sm text-gray-200 mt-1">{item.description}</p>
                            )}
                        </div>
                    </div>

                    {/* Variant Options */}
                    <div className="px-6 py-5 max-h-[50vh] overflow-y-auto">
                        <div className="space-y-6">
                            {initailSelectedAddOns.length === 0 && item.variantOptions && item.variantOptions?.flatMap(v => v.options).length > 0 && item.variantOptions?.map((variant, vIndex) => (
                                <div key={vIndex} className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-gray-900 text-lg">
                                            {variant.name}
                                            {variant.required && (
                                                <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-semibold">
                                                    Required
                                                </span>
                                            )}
                                        </h4>
                                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                                            {variant.type === 'single' ? 'Select One' : 'Select Multiple'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-2">
                                        {variant.options?.map((option, oIndex) => {
                                            const isSelected = isOptionSelected(variant.name, option.name);
                                            return (
                                                <div
                                                    key={oIndex}
                                                    onClick={() => handleOptionSelect(variant.name, option.name, variant.type)}
                                                    className={`
                                                        relative flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer
                                                        transition-all duration-200 hover:shadow-md
                                                        ${isSelected
                                                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                                        }
                                                    `}
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <div className={`
                                                            flex items-center justify-center w-5 h-5 border-2 
                                                            ${variant.type === 'single' ? 'rounded-full' : 'rounded'}
                                                            transition-all duration-200
                                                            ${isSelected
                                                                ? 'border-blue-500 bg-blue-500'
                                                                : 'border-gray-300 bg-white'
                                                            }
                                                        `}>
                                                            {isSelected && (
                                                                <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                                            )}
                                                        </div>
                                                        <span className={`font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                                                            {option.name}
                                                        </span>
                                                        {option.isDefault && (
                                                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                                                Default
                                                            </span>
                                                        )}
                                                    </div>
                                                    {option.price !== undefined && option.price !== 0 && (
                                                        <div className="flex flex-col items-end">
                                                            {item.discount && item.discount > 0 ? (
                                                                <>
                                                                    <span className="text-xs text-gray-400 line-through">
                                                                        {((option.price) ?? 0) > 0 ? '+' : ''}
                                                                        {formatCurrency((option.price) ?? 0)}
                                                                    </span>
                                                                    <span className={`font-bold ${isSelected ? 'text-blue-600' : 'text-green-600'}`}>
                                                                        {((option.price ?? 0) - ((option.price ?? 0) * item.discount / 100)) > 0 ? '+' : ''}
                                                                        {formatCurrency((option.price ?? 0) - ((option.price ?? 0) * item.discount / 100))}
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <span className={`font-bold ${isSelected ? 'text-blue-600' : 'text-gray-600'}`}>
                                                                    {((option.price) ?? 0) > 0 ? '+' : ''}
                                                                    {formatCurrency((option.price) ?? 0)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {/* Add-ons Section */}
                            {item.menuAddons && item.menuAddons.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-bold text-gray-900 text-lg">
                                            Add-ons
                                            <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-semibold">
                                                Optional
                                            </span>
                                        </h4>
                                        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                                            Select Extras
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        {item.menuAddons.map((menuAddon) => {
                                            const isSelected = selectedAddOns.has(menuAddon.addonId);
                                            const price = menuAddon.overridePrice > 0 ? menuAddon.overridePrice : menuAddon.addon.unitPrice;

                                            return (
                                                <div
                                                    key={menuAddon.addonId}
                                                    onClick={() => handleAddOnToggle(menuAddon.addonId)}
                                                    className={`
                                                        flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer
                                                        transition-all duration-200 hover:shadow-md
                                                        ${isSelected
                                                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                                        }
                                                    `}
                                                >
                                                    <div className="flex items-center space-x-3 flex-1">
                                                        <div className={`
                                                            flex items-center justify-center w-5 h-5 border-2 rounded
                                                            transition-all duration-200
                                                            ${isSelected
                                                                ? 'border-blue-500 bg-blue-500'
                                                                : 'border-gray-300 bg-white'
                                                            }
                                                        `}>
                                                            {isSelected && (
                                                                <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                                                                    {menuAddon.addon.name}
                                                                </span>
                                                                {menuAddon.isRequired && (
                                                                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                                                                        Required
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {menuAddon.addon.description && (
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {menuAddon.addon.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <p className={`text-sm font-bold ml-3 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`}>
                                                        {formatCurrency(price)}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-5 border-t border-gray-200 bg-linear-to-b from-gray-50 to-white rounded-b-3xl">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                                <span className="text-gray-700 font-semibold">Quantity:</span>
                                <div className="flex items-center space-x-2 bg-white border-2 border-gray-200 rounded-xl px-2 py-1">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                        disabled={quantity <= 1}
                                    >
                                        <Minus className="w-4 h-4 text-gray-600" />
                                    </button>
                                    <span className="w-8 text-center font-bold text-gray-900">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <Plus className="w-4 h-4 text-gray-600" />
                                    </button>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-gray-500 font-medium">Total Price</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPrice)}</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="ghost"
                                size="lg"
                                onClick={onClose}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                size="lg"
                                onClick={handleConfirm}
                                disabled={!canConfirm}
                                className="flex-1 text-white disabled:from-gray-300 disabled:to-gray-400"
                            >
                                Add to Cart
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
