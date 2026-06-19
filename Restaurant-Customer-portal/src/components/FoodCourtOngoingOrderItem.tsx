import { Store, Clock, ChevronRight } from "lucide-react";
import { formatDate, formatPrice } from "../utils";
import { FC } from "react";
import { OrderSuccessResponse } from "../features/Order/types";

interface FoodCourtOngoingOrderItemProps {
    restaurant: any;
    visibleOrders: OrderSuccessResponse[];
    handleOrderClick: (orderId?: string) => void;
    getStatusColor: (status?: string) => string;
    getStatusText: (status?: string) => string;
}

const FoodCourtOngoingOrderItem: FC<FoodCourtOngoingOrderItemProps> = ({ restaurant, visibleOrders, handleOrderClick, getStatusColor, getStatusText }) => {
    return (
        <div key={restaurant.restaurantId} className="flex flex-col gap-4">
            {/* Restaurant Header */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-orange-600">
                        <Store className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg leading-tight">{restaurant.restaurantName}</h3>
                        <p className="text-xs text-gray-500 font-medium">
                            {visibleOrders.length} Active {visibleOrders.length === 1 ? 'Order' : 'Orders'}
                        </p>
                    </div>
                </div>

                {/* Overall Status Badge */}
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${getStatusColor(restaurant.overallStatus)}`}>
                    {getStatusText(visibleOrders[0].status)}
                </span>
            </div>

            {/* Orders List */}
            <div className="space-y-3">
                {visibleOrders.map((order) => (
                    <button
                        key={order.id}
                        onClick={() => handleOrderClick(order.id)}
                        className="w-full bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-100 transition-all duration-200 group text-left relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-bl from-orange-50 to-transparent -mr-8 -mt-8 rounded-full opacity-50 group-hover:opacity-100 transition-opacity" />

                        <div className="flex items-start justify-between relative z-10 gap-3">
                            <div className="space-y-3 flex-1 min-w-0">
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-gray-900 text-lg truncate">
                                        #{order.orderNumber}
                                    </span>
                                    <span className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getStatusColor(order.status ?? "")}`}>
                                        {getStatusText(order.status)}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-gray-500 overflow-hidden">
                                    <div className="flex items-center gap-1.5 shrink-0">
                                        <Clock className="w-4 h-4 text-gray-400" />
                                        <span>{formatDate(order.createdAt ?? "")}</span>
                                    </div>
                                    <div className="w-1 h-1 bg-gray-300 rounded-full shrink-0" />
                                    <span className="truncate">
                                        {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-1 shrink-0">
                                <div className="flex items-center gap-2 text-orange-600 font-bold text-lg whitespace-nowrap">
                                    {formatPrice(Number(order.totalAmount) ?? 0)}
                                </div>
                                {order.paymentStatus && (
                                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${order.paymentStatus === 'PAID'
                                        ? 'bg-green-50 text-green-700 border-green-100'
                                        : order.paymentStatus === 'PENDING'
                                            ? 'bg-yellow-50 text-yellow-700 border-yellow-100'
                                            : 'bg-gray-50 text-gray-600 border-gray-100'
                                        }`}>
                                        {order.paymentStatus}
                                    </span>
                                )}
                                <div className="flex items-center text-orange-500 text-xs font-medium group-hover:translate-x-1 transition-transform mt-1 whitespace-nowrap">
                                    View Details <ChevronRight className="w-3 h-3 ml-0.5" />
                                </div>
                            </div>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default FoodCourtOngoingOrderItem;
