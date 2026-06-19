import { FC } from "react";
import { formatPrice } from "../utils";
import { ConfirmedItem } from "../lib/mockData";

interface OrderSummaryItemProps {
    item: ConfirmedItem;
}

const OrderSummaryItem: FC<OrderSummaryItemProps> = ({ item }) => {
    return (
        <div className="flex items-center p-2 bg-white rounded-lg border border-gray-300">

            {/* Item Image */}
            <div className="w-16 h-16 mr-3 overflow-hidden rounded-lg shrink-0">
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-500">
                    <img src={item.imageSrc} alt={item.name} className="flex" />
                </div>
            </div>

            {/* Item Details */}
            <div className="grow">
                <h3 className="font-semibold text-gray-900 leading-tight">{item.name}</h3>
                <p className="text-sm text-gray-600 mt-0.5">Qty: {item.quantity}</p>
            </div>

            {/* Price */}
            <span className="font-bold text-gray-800 shrink-0 pr-3">
                {formatPrice(item.unitPrice)}
            </span>
        </div>
    )
}

export default OrderSummaryItem;