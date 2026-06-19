import { Calendar, CheckCircle, ChefHat, Clock, DollarSign, Package, ShoppingBag, User } from "lucide-react";
import { FC } from "react";
import { Button } from "./Button";
import { formatCurrency } from "../utils";

interface ActiveOrderCardProps {
    order: any;
    index: number;
    handleViewOrder: (order: any) => void;
}

const ActiveOrderCard: FC<ActiveOrderCardProps> = ({ order, index, handleViewOrder }) => {

    const statusConfig: Record<string, { label: string, color: string, textColor: string, borderColor: string, icon: any }> = {
        'pending': { label: 'Pending', color: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-200', icon: Clock },
        'confirmed': { label: 'Confirmed', color: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200', icon: CheckCircle },
        'preparing': { label: 'Preparing', color: 'bg-indigo-50', textColor: 'text-indigo-700', borderColor: 'border-indigo-200', icon: ChefHat },
        'ready': { label: 'Ready', color: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200', icon: Package },
        'served': { label: 'Served', color: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200', icon: Package },
        'completed': { label: 'Completed', color: 'bg-green-50', textColor: 'text-green-700', borderColor: 'border-green-200', icon: Package },
    };
    const config = statusConfig[order.status.toLowerCase()] || statusConfig['pending'];
    const StatusIcon = config.icon;

    return (
        <div
            key={order.id}
            className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all bg-linear-to-r from-white to-gray-50"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                        <span className="text-lg font-bold text-blue-700">#{index + 1}</span>
                    </div>
                    <div>
                        <p className="font-bold text-lg text-gray-900">Order {order.orderNumber}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(order.createdAt).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>
                </div>
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.color} ${config.borderColor} ${config.textColor}`}>
                    <StatusIcon className="w-4 h-4" />
                    <span className="font-semibold text-sm">{config.label}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Customer</p>
                        <p className="text-sm font-semibold text-gray-900">{order.customerName}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Items</p>
                        <p className="text-sm font-semibold text-gray-900">{order.itemCount}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Amount</p>
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(Number(order.totalAmount))}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Created By</p>
                        <p className="text-sm font-semibold text-gray-900 capitalize">{order.createdByType.replace('_', ' ')}</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-gray-200">
                <Button
                    onClick={() => handleViewOrder(order)}
                    variant="primary"
                    className="flex-1"
                >
                    View Details
                </Button>
            </div>
        </div>
    );
};

export default ActiveOrderCard;