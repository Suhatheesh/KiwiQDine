import { Clock, MapPin, User } from "lucide-react";
import { FC, useEffect, useMemo, useState } from "react";
import { Button } from "./Button";
import { OrderItemResponse } from "../features/orders/types";
import { OrderStatus, OrderType } from "../utils/constants";
import { useAuth } from "../hooks/useAuth";
import { hexToRgba } from "../utils";
import { calculateMaxRemainingTime, formatRemainingTime, getAllItemsFromOrder, getTimeStatusColor } from "../utils/timeUtils";

interface OrderItemCardProp {
    item: OrderItemResponse
    isWaiterConfirmation?: boolean;
    onPreparing?: (item: OrderItemResponse) => void
    onPrintReceipt?: (item: OrderItemResponse) => void
}

const OrderItemCard: FC<OrderItemCardProp> = ({ item, isWaiterConfirmation, onPreparing, onPrintReceipt }) => {

    const { primaryColor } = useAuth();

    const allItems = useMemo(() => {
        return getAllItemsFromOrder(item.itemsByCategory || []);
    }, [item.itemsByCategory]);

    const [maxRemainingTime, setMaxRemainingTime] = useState<number | null>(
        calculateMaxRemainingTime(allItems)
    );

    useEffect(() => {
        setMaxRemainingTime(calculateMaxRemainingTime(allItems));
        const interval = setInterval(() => {
            setMaxRemainingTime(calculateMaxRemainingTime(allItems));
            if (maxRemainingTime === 0) {
                clearInterval(interval)
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [item.startedAt, item.estimatedPreparationTime, item.status, allItems, maxRemainingTime]);

    const filterItemList = useMemo(() => {
        const itemList = item.itemsByCategory?.flatMap(i => i.items.map(i => `${i.quantity}x ${i.menuName}`));
        if (itemList && itemList.length > 3) {
            const splicList = itemList.splice(0, 3)
            return [...splicList, `+${itemList.length} more`]
        }
        return itemList;
    }, [item.itemsByCategory])

    const getStatusGradient = () => {
        switch (item.status) {
            case OrderStatus.CONFIRMED:
                return "from-orange-500 to-orange-600";
            case OrderStatus.PREPARING:
                return `linear-gradient(to right, ${hexToRgba(primaryColor, 0.8)}, ${hexToRgba(primaryColor, 0.9)})`;
            case OrderStatus.READY:
                return "from-green-500 to-green-600";
            default:
                return "from-gray-500 to-gray-600";
        }
    }

    const totalEntries = item.itemsByCategory?.reduce((sum, category) => {
        return sum + category.items.length;
    }, 0);

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full">
            {/* Subtle Status Indicator */}
            <div style={{ background: item.status === OrderStatus.PREPARING ? getStatusGradient() : '' }} className={`h-1 w-12 rounded-full ${item.status !== OrderStatus.PREPARING ? `bg-linear-to-r ${getStatusGradient()}` : ''} mb-4`}></div>

            {/* Order Number - Clean and Clear */}
            <h1 className="text-2xl font-bold pb-3 text-gray-800">
                #{item.orderNumber}
            </h1>

            {/* Order Type Badge - Softer Colors */}
            <div className="mb-4">
                <span style={{
                    background: item.orderType === OrderType.DINEIN
                        ? `linear-gradient(to right, ${hexToRgba(primaryColor, 0.08)}, ${hexToRgba(primaryColor, 0.12)})`
                        : '',
                    color: item.orderType === OrderType.DINEIN ? primaryColor : '',
                    borderColor: item.orderType === OrderType.DINEIN ? hexToRgba(primaryColor, 0.3) : ''
                }} className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide ${item.orderType === OrderType.DINEIN
                    ? 'border'
                    : 'bg-linear-to-r from-orange-50 to-orange-100 text-orange-700 border border-orange-200'
                    }`}>
                    {item.orderType === OrderType.DINEIN ? '🍽️ Dine In' : item.orderType === OrderType.PARKING ? '🚗 Parking' : '🥡 Takeaway'}
                </span>
            </div>

            {/* Maximum Countdown Timer - Shows longest remaining time */}
            {item.status === OrderStatus.PREPARING && maxRemainingTime !== null && (
                <div className={`mb-4 p-3 rounded-lg border-2 ${maxRemainingTime === 0 ? 'bg-red-50 border-red-300' : 'bg-blue-50 border-blue-200'}`}>
                    <div className={`flex items-center gap-2 ${getTimeStatusColor(maxRemainingTime)} font-bold text-sm`}>
                        <Clock className="w-5 h-5" />
                        <div className="flex-1">
                            {maxRemainingTime === 0 ? (
                                <div>
                                    <p className="text-red-600 font-bold animate-pulse">⚠️ Items Overdue!</p>
                                    <p className="text-xs text-red-500 font-normal mt-0.5">Check kitchen status</p>
                                </div>
                            ) : (
                                <div>
                                    <p>🔥 {formatRemainingTime(maxRemainingTime)}</p>
                                    <p className="text-xs text-gray-600 font-normal mt-0.5">Max time remaining</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Customer Info - Cleaner Layout */}
            <div className="space-y-2.5 mb-4">
                <div className="flex items-center gap-2.5">
                    <div style={{ background: `linear-gradient(to bottom right, ${hexToRgba(primaryColor, 0.08)}, ${hexToRgba(primaryColor, 0.12)})` }} className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0">
                        <MapPin style={{ color: primaryColor }} className="w-4 h-4" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Table</p>
                        <p className="text-sm text-gray-800 font-semibold">T-{item.tableNo}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-linear-to-br from-purple-50 to-pink-50 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-purple-600" strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">Customer</p>
                        <p className="text-sm text-gray-800 font-semibold truncate">{item.customerName}</p>
                    </div>
                </div>
            </div>

            {/* Subtle Divider */}
            <div className="h-px bg-gray-200 w-full my-3" />

            {/* Items Section - Better Readability */}
            <div className="flex-1 flex flex-col min-h-[120px]">
                <div className="flex items-center justify-between mb-2.5">
                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Order Items</p>
                    <span style={{ background: `linear-gradient(to right, ${hexToRgba(primaryColor, 0.85)}, ${hexToRgba(primaryColor, 0.95)})` }} className="px-2.5 py-1 text-white text-xs font-semibold rounded-md">
                        {totalEntries}
                    </span>
                </div>
                <div className="space-y-1.5 flex-1">
                    {filterItemList?.map((itemText, index) => (
                        <div key={index} className="flex items-start gap-2">
                            <div className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 shrink-0"></div>
                            <p className="text-sm text-gray-600 leading-relaxed">{itemText}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Subtle Divider */}
            <div className="h-px bg-gray-200 w-full my-3" />

            {/* Footer - Action Button Only */}
            {item.status !== OrderStatus.SERVED && item.status !== OrderStatus.COMPLETED && (
                <div className="pt-1">
                    <Button
                        variant="secondary"
                        onClick={() => onPrintReceipt && onPrintReceipt(item)}
                        className="w-full text-gray-600 px-4 py-2.5 mb-2 rounded-lg font-semibold text-sm shadow-sm hover:shadow transition-all"
                    >
                        Print Receipt
                    </Button>
                    <Button
                        onClick={() => onPreparing && onPreparing(item)}
                        className="w-full text-white px-4 py-2.5 rounded-lg font-semibold text-sm shadow-sm hover:shadow transition-all"
                    >
                        {(item.status === OrderStatus.PREPARING || isWaiterConfirmation) ? 'View Order' : item.status === OrderStatus.READY && item.orderType === OrderType.DINEIN ? 'Mark as Served' : item.status === OrderStatus.READY && (item.orderType === OrderType.TAKEAWAY || item.orderType === OrderType.PARKING) ? 'Complete Order' : 'Start Preparing'}
                    </Button>
                </div>
            )}
        </div>
    )
}

export default OrderItemCard