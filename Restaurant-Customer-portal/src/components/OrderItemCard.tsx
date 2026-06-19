import React, { useEffect, useState } from 'react';
import { Clock, CheckCircle2, ChefHat, Package, Utensils, Timer } from 'lucide-react';
import { OrderItems } from '../features/Order/types';
import { formatPrice } from '../utils';
import { addMinutes } from 'date-fns';

interface OrderItemCardProps {
    item: OrderItems;
}

const calculateTimeMetrics = (item: OrderItems) => {
    const isInProgress = item.status?.toLowerCase() === 'in_progress';

    // If backend provides pre-calculated times, use them
    if (item.remainingTime !== undefined && item.elapsedTime !== undefined) {
        const remainingMs = item.remainingTime * 60 * 1000;
        const elapsedMs = item.elapsedTime * 60 * 1000;
        const totalMs = remainingMs + elapsedMs;
        const progress = totalMs > 0 ? Math.min(100, (elapsedMs / totalMs) * 100) : 0;

        return {
            remainingMs: Math.max(0, remainingMs),
            totalMs,
            progress,
            isLive: isInProgress && (item.remainingTime > 0 || item.status === 'in_progress'),
            estimatedEndTime: item.readyAt ? new Date(item.readyAt) : null,
            isDataPending: false
        };
    }

    if (!item.startedAt || !item.estimatedPreparationTime) {
        return {
            remainingMs: 0,
            totalMs: 0,
            progress: 0,
            isLive: isInProgress,
            estimatedEndTime: null,
            isDataPending: isInProgress
        };
    }

    const startTime = new Date(item.startedAt);
    const totalMs = item.estimatedPreparationTime * 60 * 1000;
    const estimatedEndTime = addMinutes(startTime, item.estimatedPreparationTime);
    const now = new Date();
    const elapsedMs = now.getTime() - startTime.getTime();
    const remainingMs = estimatedEndTime.getTime() - now.getTime();

    // Calculate progress (0 to 100)
    const progress = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));

    return {
        remainingMs: Math.max(0, remainingMs),
        totalMs,
        progress,
        isLive: isInProgress && remainingMs > 0,
        estimatedEndTime,
        isDataPending: false
    };
};

const formatCountdown = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const OrderItemCard: React.FC<OrderItemCardProps> = ({ item }) => {
    const [metrics, setMetrics] = useState(calculateTimeMetrics(item));
    const [countdown, setCountdown] = useState(formatCountdown(metrics.remainingMs));

    useEffect(() => {
        const nextMetrics = calculateTimeMetrics(item);
        setMetrics(nextMetrics);
        setCountdown(formatCountdown(nextMetrics.remainingMs));
    }, [item]);

    useEffect(() => {
        if (!metrics.isLive || metrics.isDataPending) return;

        const timer = setInterval(() => {
            const nextMetrics = calculateTimeMetrics(item);
            setMetrics(nextMetrics);
            setCountdown(formatCountdown(nextMetrics.remainingMs));

            if (nextMetrics.remainingMs <= 0) {
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [item, metrics.isLive, metrics.isDataPending]);


    const getStatusConfig = () => {
        const status = item.status?.toLowerCase();
        switch (status) {
            case 'pending':
                return {
                    icon: <Package className="w-3.5 h-3.5" />,
                    label: 'Queued',
                    sub: 'Waiting for chef',
                    theme: 'slate',
                    bg: 'bg-white',
                    border: 'border-gray-200',
                    accent: 'bg-slate-500',
                    text: 'text-slate-600',
                    badge: 'bg-slate-100 text-slate-700',
                    lightBg: 'bg-slate-50'
                };
            case 'in_progress':
                return {
                    icon: <ChefHat className="w-3.5 h-3.5 animate-pulse" />,
                    label: 'Cooking',
                    sub: 'Chef is working',
                    theme: 'orange',
                    bg: 'bg-white',
                    border: 'border-orange-200',
                    accent: 'bg-orange-500',
                    text: 'text-orange-700',
                    badge: 'bg-orange-50 text-orange-700 ring-1 ring-orange-100',
                    lightBg: 'bg-orange-50'
                };
            case 'ready':
                return {
                    icon: <Utensils className="w-3.5 h-3.5" />,
                    label: 'Ready',
                    sub: 'Ready for pickup',
                    theme: 'emerald',
                    bg: 'bg-white',
                    border: 'border-emerald-200',
                    accent: 'bg-emerald-500',
                    text: 'text-emerald-700',
                    badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
                    lightBg: 'bg-emerald-50'
                };
            case 'served':
                return {
                    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
                    label: 'Served',
                    sub: 'Enjoy your meal',
                    theme: 'indigo',
                    bg: 'bg-white',
                    border: 'border-indigo-200',
                    accent: 'bg-indigo-500',
                    text: 'text-indigo-700',
                    badge: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100',
                    lightBg: 'bg-indigo-50'
                };
            default:
                return {
                    icon: <Clock className="w-3.5 h-3.5" />,
                    label: 'Processing',
                    sub: 'Updating status',
                    theme: 'slate',
                    bg: 'bg-white',
                    border: 'border-gray-200',
                    accent: 'bg-slate-400',
                    text: 'text-slate-600',
                    badge: 'bg-slate-100 text-slate-600',
                    lightBg: 'bg-slate-50'
                };
        }
    };

    const config = getStatusConfig();

    return (
        <div className={`group relative overflow-hidden rounded-2xl border ${config.border} bg-white p-5 transition-all duration-300 hover:shadow-lg hover:border-gray-300`}>
            {/* Visual Rail Indicator */}
            <div className={`absolute top-0 bottom-0 left-0 w-1 transition-colors duration-500 ${config.accent}`} />

            <div className="flex flex-col gap-5 pl-2">
                {/* 1. Header Row */}
                <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                        {item.menuImage ? (
                            <div className="h-14 w-14 overflow-hidden rounded-xl shadow-sm border border-gray-100">
                                <img
                                    src={item.menuImage}
                                    alt={item.menuName}
                                    className="h-full w-full object-cover"
                                />
                                <div className={`absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center rounded-lg ${config.accent} text-white font-bold text-[10px] shadow ring-2 ring-white`}>
                                    {item.quantity}
                                </div>
                            </div>
                        ) : (
                            <div className={`h-14 w-14 flex items-center justify-center rounded-xl ${config.accent} text-white font-bold text-xl shadow-sm`}>
                                {item.quantity}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h4 className="text-lg font-bold text-gray-900 leading-tight mb-1">
                                    {item.menuName}
                                </h4>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${config.badge}`}>
                                        {config.icon}
                                        {config.label}
                                    </span>
                                    {item.specialInstructions?.portion && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-500 uppercase tracking-widest border border-gray-200">
                                            {item.specialInstructions.portion}
                                        </span>
                                    )}

                                    {item.addons && item.addons.length > 0 && item.addons.map((addon, idx) => (
                                        <span
                                            key={idx}
                                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200"
                                        >
                                            + {addon.addonName || addon.name}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Financial Info moved to top right for better use of space on mobile */}
                            <div className="text-right">
                                <span className="text-lg font-bold text-gray-900">
                                    {formatPrice(parseFloat(item.totalPrice || '0'))}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Metrics & Actions */}
                <div className="flex items-end justify-between gap-4 border-t border-gray-50 pt-4 mt-1">
                    <div className="flex flex-wrap items-center gap-6">
                        {/* Duration */}
                        {item.estimatedPreparationTime && (
                            <div className="flex items-center gap-2 text-gray-500">
                                <Timer className="h-4 w-4" />
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 leading-none">Duration</span>
                                    <span className="text-xs font-bold leading-tight">{item.estimatedPreparationTime} min</span>
                                </div>
                            </div>
                        )}

                        {/* Live Timer */}
                        {metrics.isLive && (
                            <div className="flex items-center gap-2 text-orange-600">
                                <div className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-orange-400 leading-none">Ready In</span>
                                    <span className="text-sm font-black font-mono leading-tight">{metrics.isDataPending ? '--:--' : countdown}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Progress Bar (Professional Thin Line) */}
                {item.status === 'in_progress' && (
                    <div className="space-y-1.5">
                        <div className="h-1 w-full overflow-hidden rounded-full bg-gray-100">
                            <div
                                className={`h-full transition-all duration-1000 ease-out ${config.accent}`}
                                style={{ width: `${metrics.progress}%` }}
                            />
                        </div>
                        <div className="flex justify-between text-[9px] font-medium text-gray-400 uppercase tracking-wider">
                            <span>Preparing</span>
                            <span>{Math.round(metrics.progress)}%</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderItemCard;
