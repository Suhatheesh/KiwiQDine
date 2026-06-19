import { ChevronRight, Clock } from "lucide-react";
import { formatDate, formatPrice } from "../utils";
import { OrderItemsByCategory, OrderSuccessResponse } from "../features/Order/types";

interface RestaurantOngoingOrderItemProps {
    order: OrderSuccessResponse;
    handleOrderClick: (orderId?: string) => void;
    getStatusColor: (status?: string) => string;
    getStatusText: (status?: string) => string;
}

const RestaurantOngoingOrderItem: React.FC<RestaurantOngoingOrderItemProps> = ({ order, handleOrderClick, getStatusColor, getStatusText }) => {

    const itemCount = (order: OrderItemsByCategory[]) => {
        return order.reduce((total, item) => total + item.items.length, 0);
    };

    return (
        <button
            key={order.id}
            onClick={() => handleOrderClick(order.id)}
            className="w-full bg-white border border-gray-200 rounded-xl p-4 hover:border-orange-300 hover:shadow-md transition-all duration-200"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 text-left min-w-0">
                    {/* Order Number and Status */}
                    <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-gray-900 truncate">
                            {order.orderNumber}
                        </span>
                        <span className={`shrink-0 text-xs px-2 py-1 rounded-full border ${getStatusColor(order.status ?? "")}`}>
                            {getStatusText(order.status)}
                        </span>
                    </div>

                    {/* Date and Time */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2 overflow-hidden">
                        <Clock className="w-4 h-4 shrink-0" />
                        <span className="truncate">{formatDate(order.createdAt ?? "")}</span>
                    </div>

                    {/* Items Count */}
                    <p className="text-sm text-gray-600 truncate">
                        {itemCount(order.itemsByCategory ?? [])} item{itemCount(order.itemsByCategory ?? []) > 1 ? 's' : ''}
                    </p>
                </div>

                {/* Amount and Arrow */}
                <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                        <p className="font-bold text-gray-900 whitespace-nowrap">
                            {formatPrice(Number(order.totalAmount) ?? 0)}
                        </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                </div>
            </div>
        </button>
    );
};

export default RestaurantOngoingOrderItem;