import { MinusCircle, PlusCircle, Trash } from "lucide-react";
import { FC } from "react";
import { formatCurrency } from "../utils";
import { QtyUpdateType } from "../utils/constants";
import { SelectedVariant } from "./VariantSelectionModal";
import { SelectedAddOn } from "../features/orders/types";
import { MenuItem } from "../features/menuItems/types";

interface CartOrderItemCardProp {
    item: MenuItem;
    index: number;
    qty: number;
    total: number;
    handleIncreaseQty: (type: QtyUpdateType, index: number) => void;
    handleDeleteItem: (index: number) => void;
    selectedVariants?: SelectedVariant[];
    selectedAddOns?: SelectedAddOn[];
    primaryColor: string;
    onClick: (item: MenuItem, selectedAddOns?: SelectedAddOn[]) => void
}

const CartOrderItemCard: FC<CartOrderItemCardProp> = ({ item, index, qty, total, handleIncreaseQty, handleDeleteItem, selectedVariants, selectedAddOns, primaryColor, onClick }) => {
    const handleItemClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e?.stopPropagation();
        onClick(item, selectedAddOns);
    }
    return (
        <div onClick={handleItemClick}
            className={`flex space-x-4 px-4 py-4 rounded-xl mb-2 transition-all duration-200 ${!(index % 2) ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 group`}
        >
            <p className="font-bold text-gray-600 group-hover:text-blue-600">{index + 1}</p>
            <div className='flex flex-1 flex-col'>
                <p className='font-bold text-gray-900'>{item.name}</p>
                {selectedVariants && selectedVariants.length > 0 && (
                    <div className='flex flex-col mt-1 space-y-0.5'>
                        {selectedVariants.map((variant, vIdx) => (
                            <p key={vIdx} className='text-xs text-gray-500'>
                                {variant.variantName}: {variant.options.map(opt => opt.name).join(', ')}
                            </p>
                        ))}
                    </div>
                )}
                {selectedAddOns && selectedAddOns.length > 0 && (
                    <div className='flex flex-col mt-1 space-y-0.5'>
                        <p className='text-xs font-semibold text-blue-600'>Add-ons:</p>
                        {selectedAddOns.map((addon, aIdx) => (
                            <p key={aIdx} className='text-xs text-gray-500 ml-2'>
                                • {addon.addonName} ({formatCurrency(addon.unitPrice)})
                            </p>
                        ))}
                    </div>
                )}
                <div className="flex items-center space-x-3 mt-3">
                    <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg px-2 py-1 select-none">
                        <MinusCircle
                            className="w-5 h-5 cursor-pointer text-gray-500 hover:text-red-500 transition-colors"
                            onClick={(e) => { e?.stopPropagation(); handleIncreaseQty(QtyUpdateType.DECREASE, index) }}
                        />
                        <p className="font-semibold min-w-5 text-center">{qty}</p>
                        <PlusCircle
                            className="w-5 h-5 cursor-pointer text-gray-500 hover:text-green-500 transition-colors"
                            onClick={(e) => { e?.stopPropagation(); handleIncreaseQty(QtyUpdateType.INCREASE, index) }}
                        />
                    </div>
                </div>
            </div>
            <div className='text-end flex flex-col items-end justify-between'>
                <p style={{ color: primaryColor }} className='font-bold'>{formatCurrency(total)}</p>
                <Trash
                    className="w-5 h-5 cursor-pointer text-gray-400 hover:text-red-500 transition-colors"
                    onClick={(e) => { e?.stopPropagation(); handleDeleteItem(index) }}
                />
            </div>
        </div>
    )
}

export default CartOrderItemCard