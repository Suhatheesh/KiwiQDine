import { Package, Calendar, Clock, User, PhoneIcon, Star, UtensilsCrossed, Car, ShoppingBag, CheckCircle, Flame, AlertCircle, XCircle } from "lucide-react";
import { StarRating } from "../components/StarRating";
import { EnhancedStatusBadge } from "../components/ui/Badge/EnhancedStatusBadge";
import { Column } from "../components/ui/DataTable";
import { OrderItemResponse } from "../features/orders/types";
import { formatCurrency } from "../utils";
import { UserRole, OrderType, OrderStatus } from "../utils/constants";
import { User as UserType } from "../features/auth/types";

export const orderTableColumn: Column<OrderItemResponse>[] = [
    {
        key: 'orderNumber',
        label: 'Order ID',
        sortable: true,
        width: '140px',
        render: (order) => (
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                    <Package className="w-4 h-4 text-primary-600" />
                </div>
                <span className="font-semibold text-primary-600 tracking-wide">#{order.orderNumber}</span>
            </div>
        ),
    },
    {
        key: 'createdAt',
        label: 'Date & Time',
        sortable: true,
        width: '200px',
        render: (order) => {
            const date = new Date(order.createdAt || '');
            return (
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                        <div className="font-medium text-gray-900">
                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>
            );
        },
    },
    {
        key: 'customerName',
        label: 'Customer',
        width: '220px',
        render: (order) => (
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                    <div className="font-medium text-gray-900">{order.customerName || 'Walk-in Customer'}</div>
                    {order.customerPhone && (
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                            <PhoneIcon className="w-3 h-3" />
                            {order.customerPhone}
                        </div>
                    )}
                </div>
            </div>
        ),
    },
    {
        key: 'orderType',
        label: 'Type',
        sortable: true,
        width: '140px',
        align: 'center',
        render: (order) => {
            const isDineIn = order.orderType === OrderType.DINEIN;
            const isParking = order.orderType === OrderType.PARKING;
            return (
                <div className="flex items-center justify-center gap-1.5">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-semibold text-xs transition-all duration-200 hover:scale-105 ${isDineIn
                        ? 'bg-blue-500/10 border-blue-400/30 text-blue-700'
                        : isParking ? 'bg-green-500/10 border-green-400/30 text-green-700' : 'bg-orange-500/10 border-orange-400/30 text-orange-700'
                        }`}>
                        {isDineIn ? (
                            <UtensilsCrossed className="w-3 h-3" />
                        ) : isParking ? (
                            <Car className="w-3 h-3" />
                        ) : (
                            <ShoppingBag className="w-3 h-3" />
                        )}
                        <span className="font-bold tracking-tight">
                            {isDineIn ? 'Dine-In' : isParking ? 'Parking' : 'Takeaway'}
                        </span>
                    </div>
                    {order.tableNo && isDineIn && (
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                            T{order.tableNo}
                        </span>
                    )}
                </div>
            );
        },
    },
    {
        key: 'status',
        label: 'Status',
        sortable: true,
        width: '150px',
        align: 'center',
        render: (order: OrderItemResponse) => {
            const statusConfig: any = {
                [OrderStatus.PENDING]: {
                    bg: 'bg-amber-100',
                    border: 'border-amber-500',
                    text: 'text-amber-800',
                    icon: <Clock className="w-3 h-3" />,
                    label: 'Pending',
                    showPulse: true,
                    pulseColor: 'bg-amber-500'
                },
                [OrderStatus.CONFIRMED]: {
                    bg: 'bg-blue-100',
                    border: 'border-blue-500',
                    text: 'text-blue-800',
                    icon: <CheckCircle className="w-3 h-3" />,
                    label: 'Confirmed',
                    showPulse: false
                },
                [OrderStatus.PREPARING]: {
                    bg: 'bg-indigo-100',
                    border: 'border-indigo-500',
                    text: 'text-indigo-800',
                    icon: <Flame className="w-3 h-3 animate-pulse" />,
                    label: 'Preparing',
                    showPulse: false
                },
                [OrderStatus.READY]: {
                    bg: 'bg-green-100',
                    border: 'border-green-500',
                    text: 'text-green-800',
                    icon: <Package className="w-3 h-3" />,
                    label: 'Ready',
                    showPulse: false
                },
                [OrderStatus.COMPLETED]: {
                    bg: 'bg-emerald-100',
                    border: 'border-emerald-500',
                    text: 'text-emerald-800',
                    icon: <CheckCircle className="w-3 h-3" />,
                    label: 'Completed',
                    showPulse: false
                },
                [OrderStatus.HOLD]: {
                    bg: 'bg-gray-100',
                    border: 'border-gray-500',
                    text: 'text-gray-800',
                    icon: <AlertCircle className="w-3 h-3" />,
                    label: 'Hold',
                    showPulse: true,
                    pulseColor: 'bg-orange-500'
                },
                [OrderStatus.CANCELLED]: {
                    bg: 'bg-red-100',
                    border: 'border-red-500',
                    text: 'text-red-800',
                    icon: <XCircle className="w-3 h-3" />,
                    label: 'Cancelled',
                    showPulse: false
                },
                [OrderStatus.SERVED]: {
                    bg: 'bg-purple-100',
                    border: 'border-purple-500',
                    text: 'text-purple-800',
                    icon: <XCircle className="w-3 h-3" />,
                    label: 'Served',
                    showPulse: false
                },
                [OrderStatus.ABANDONED]: {
                    bg: 'bg-orange-100',
                    border: 'border-orange-500',
                    text: 'text-orange-800',
                    icon: <XCircle className="w-3 h-3" />,
                    label: 'Abandoned',
                    showPulse: false
                }
            };
            const config = statusConfig[order.status] || statusConfig[OrderStatus.PENDING];

            return (
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${config.bg} ${config.border} ${config.text} font-semibold text-xs transition-all duration-200 hover:scale-105`}>
                    {config.icon}
                    <span className="font-bold tracking-tight">{config.label}</span>
                    {config.showPulse && (
                        <span className="relative flex h-1.5 w-1.5">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.pulseColor} opacity-75`}></span>
                            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.pulseColor}`}></span>
                        </span>
                    )}
                </div>
            );
        },
    },
    {
        key: 'totalAmount',
        label: 'Amount',
        sortable: true,
        width: '140px',
        align: 'right',
        render: (order) => (
            <div className="text-right">
                <div className="font-bold text-lg text-gray-900">
                    {formatCurrency(Number(order.totalAmount))}
                </div>
                {order.paymentStatus && (
                    <div className="text-xs mt-0.5">
                        <EnhancedStatusBadge
                            status={order.paymentStatus}
                            type="payment"
                            size="sm"
                            showIcon={false}
                        />
                    </div>
                )}
            </div>
        ),
    },
]

export const orderTableData = (activeTab: "history" | "hold", user?: UserType | null) => {
    if (activeTab === "hold") {
        return [...orderTableColumn, {
            key: 'holdReason',
            label: 'Hold Reason',
            width: '220px',
            render: (order: OrderItemResponse) => (
                <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-700 line-clamp-2">{order.holdReason || 'No reason provided'}</span>
                </div>
            ),
        }];
    } else if (user && (user.role !== UserRole.KITCHEN_STAFF && user.role !== UserRole.WAITER)) {
        return [...orderTableColumn, {
            key: 'customerReview',
            label: 'Customer Review',
            width: '220px',
            render: (order: OrderItemResponse) => (
                <div className="flex flex-col gap-1 justify-center min-h-[40px]">
                    {order.hasReview && order.review ? (
                        <>
                            <div className="flex items-center gap-1">
                                <StarRating rating={order.review.rating || 0} showLabel={false} size="sm" />
                                <span className="text-xs font-bold text-amber-600 ml-0.5">
                                    {order.review.rating?.toFixed(1)}
                                </span>
                            </div>
                            {order.review.comment && (
                                <div className="text-[11px] text-gray-500 italic line-clamp-1 max-w-[180px]" title={order.review.comment}>
                                    "{order.review.comment}"
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex items-center gap-2 text-gray-300">
                            <Star className="w-3.5 h-3.5 fill-gray-100" />
                            <span className="text-xs font-medium italic">No Review</span>
                        </div>
                    )}
                </div>
            ),
        }];
    }
    return [...orderTableColumn];
};