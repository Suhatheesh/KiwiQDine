import { Package, Calendar, Clock, User, UtensilsCrossed, Car, ShoppingBag, CheckCircle, Flame, AlertCircle, XCircle, Wallet, CreditCard, QrCode } from "lucide-react";
import { Column } from "../components/ui/DataTable";
import { OrderItemResponse } from "../features/orders/types";
import { formatCurrency } from "../utils";
import { OrderType } from "../utils/constants";

export const cashierTableColumn: Column<OrderItemResponse>[] = [
    {
        key: 'orderNumber',
        label: 'ORDER ID',
        sortable: true,
        width: '140px',
        render: (order) => (
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                    <Package className="w-4 h-4 text-primary-600" />
                </div>
                <span className="font-mono font-semibold text-primary-600 tracking-wide">#{order.orderNumber ?? 'N/A'}</span>
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
        width: '180px',
        render: (order) => (
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-purple-600" />
                </div>
                <div className="truncate">
                    <div className="font-medium text-gray-900 truncate">{order.customerName || 'Walk-in'}</div>
                </div>
            </div>
        ),
    },
    {
        key: 'orderType',
        label: 'Type',
        sortable: true,
        width: '150px',
        align: 'center',
        render: (order) => {
            const isDineIn = order.orderType === OrderType.DINEIN;
            const isParking = order.orderType === OrderType.PARKING;
            return (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isDineIn
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : isParking ? 'bg-green-50 border-green-200 text-green-700' : 'bg-orange-50 border-orange-200 text-orange-700'
                    }`}>
                    {isDineIn ? (
                        <UtensilsCrossed className="w-4 h-4" />
                    ) : isParking ? (
                        <Car className="w-4 h-4" />
                    ) : (
                        <ShoppingBag className="w-4 h-4" />
                    )}
                    <span className="font-medium text-sm">
                        {isDineIn ? 'Dine-In' : isParking ? 'Parking' : 'Takeaway'}
                    </span>
                </div>
            );
        },
    },
    {
        key: 'status',
        label: 'Order Status',
        sortable: true,
        width: '150px',
        align: 'center',
        render: (order) => {
            const statusConfig: Record<string, any> = {
                'pending': {
                    bg: 'bg-amber-100',
                    border: 'border-amber-500',
                    text: 'text-amber-800',
                    icon: <Clock className="w-3 h-3" />,
                    label: 'Pending',
                    showPulse: true,
                    pulseColor: 'bg-amber-500'
                },
                'confirmed': {
                    bg: 'bg-blue-100',
                    border: 'border-blue-500',
                    text: 'text-blue-800',
                    icon: <CheckCircle className="w-3 h-3" />,
                    label: 'Confirmed',
                    showPulse: false
                },
                'preparing': {
                    bg: 'bg-indigo-100',
                    border: 'border-indigo-500',
                    text: 'text-indigo-800',
                    icon: <Flame className="w-3 h-3 animate-pulse" />,
                    label: 'Preparing',
                    showPulse: false
                },
                'ready': {
                    bg: 'bg-green-100',
                    border: 'border-green-500',
                    text: 'text-green-800',
                    icon: <Package className="w-3 h-3" />,
                    label: 'Ready',
                    showPulse: false
                },
                'completed': {
                    bg: 'bg-emerald-100',
                    border: 'border-emerald-500',
                    text: 'text-emerald-800',
                    icon: <CheckCircle className="w-3 h-3" />,
                    label: 'Completed',
                    showPulse: false
                },
                'hold': {
                    bg: 'bg-gray-100',
                    border: 'border-gray-500',
                    text: 'text-gray-800',
                    icon: <AlertCircle className="w-3 h-3" />,
                    label: 'Hold',
                    showPulse: true,
                    pulseColor: 'bg-orange-500'
                },
                'cancelled': {
                    bg: 'bg-red-100',
                    border: 'border-red-500',
                    text: 'text-red-800',
                    icon: <XCircle className="w-3 h-3" />,
                    label: 'Cancelled',
                    showPulse: false
                },
                "served": {
                    bg: 'bg-purple-100',
                    border: 'border-purple-500',
                    text: 'text-purple-800',
                    icon: <XCircle className="w-3 h-3" />,
                    label: 'Served',
                    showPulse: false
                },
                'abandoned': {
                    bg: 'bg-orange-100',
                    border: 'border-orange-500',
                    text: 'text-orange-800',
                    icon: <XCircle className="w-3 h-3" />,
                    label: 'Abandoned',
                    showPulse: false
                }
            };

            const status = (order.status ?? 'pending').toLowerCase();
            const config = statusConfig[status] || statusConfig['pending'];

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
        key: 'paymentStatus',
        label: 'Payment',
        sortable: true,
        width: '140px',
        align: 'center',
        render: (order) => {
            const paymentConfig: Record<string, any> = {
                'paid': {
                    bg: 'bg-emerald-500/10',
                    border: 'border-emerald-400/30',
                    text: 'text-emerald-700',
                    icon: <CheckCircle className="w-3 h-3" />,
                    label: 'Paid',
                    showPulse: false
                },
                'pending': {
                    bg: 'bg-amber-500/10',
                    border: 'border-amber-400/30',
                    text: 'text-amber-700',
                    icon: <Clock className="w-3 h-3" />,
                    label: 'Pending',
                    showPulse: true,
                    pulseColor: 'bg-amber-500'
                },
                'overdue': {
                    bg: 'bg-rose-500/10',
                    border: 'border-rose-400/30',
                    text: 'text-rose-700',
                    icon: <AlertCircle className="w-3 h-3" />,
                    label: 'Overdue',
                    showPulse: true,
                    pulseColor: 'bg-rose-500'
                },
                'cancelled': {
                    bg: 'bg-slate-500/10',
                    border: 'border-slate-400/30',
                    text: 'text-slate-700',
                    icon: <XCircle className="w-3 h-3" />,
                    label: 'Cancelled',
                    showPulse: false
                }
            };

            const status = (order.paymentStatus ?? 'pending').toLowerCase();
            const config = paymentConfig[status] || paymentConfig['pending'];

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
        key: 'paymentMethod',
        label: 'Method',
        width: '120px',
        align: 'center',
        render: (order) => {
            const method = order.paymentMethod?.toLowerCase() ?? "not-set";
            const iconMap: Record<string, any> = {
                'cash': <Wallet className="w-3 h-3" />,
                'card': <CreditCard className="w-3 h-3" />,
                'qr': <QrCode className="w-3 h-3" />,
                'cashier_cash': <Wallet className="w-3 h-3" />,
                'cashier_card': <CreditCard className="w-3 h-3" />,
                'cashier_qr': <QrCode className="w-3 h-3" />,
                'cashier': <User className="w-3 h-3" />,
            };
            const labelMap: Record<string, string> = {
                'cash': 'Cash',
                'card': 'Card',
                'qr': 'QR Code',
                'cashier_cash': 'Cashier - Cash',
                'cashier_card': 'Cashier - Card',
                'cashier_qr': 'Cashier - QR',
                'cashier': 'Cashier',
            };
            return (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                    {iconMap[method] || null}
                    <span>{labelMap[method] || order.paymentMethod || "Not Set"}</span>
                </div>
            );
        },
    },
    {
        key: 'totalAmount',
        label: 'Amount',
        sortable: true,
        width: '130px',
        align: 'right',
        render: (order) => (
            <div className="font-bold text-lg text-gray-900">
                {formatCurrency(Number(order.totalAmount))}
            </div>
        ),
    },
]
