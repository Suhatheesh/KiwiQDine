import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, Eye, AlertTriangle, Clock } from 'lucide-react';
import SocketService from '../services/SocketService';
import { useAuth } from '../hooks/useAuth';
import { Modal } from './Modal';
import { useAlertAudio } from '../hooks/useAlertAudio';
import { RouteLinks } from '../routers/type';
import logo from '../assets/logo.png'
import alertSound from '../assets/alert-sound.mp3'

interface Alert {
    id: string;
    type: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    title: string;
    message: string;
    orderData: OrderData;
    timestamp: string; // ISO string from backend
    read: boolean;
}

interface OrderData {
    createdAt: string;
    customerId: string;
    customerName: string;
    items: any[];
    orderId: string;
    orderNumber: string;
    orderType: string;
    status: string;
    tableNo: string;
    totalAmount: string;
    waitingTime: number;
}

export const OrderAlerts: React.FC = () => {
    const playAlertSound = useAlertAudio(alertSound);
    const { user } = useAuth();
    const navigate = useNavigate();
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const socketManager = SocketService.getInstance();
    const processedAlertIds = useRef(new Set<string>());

    useEffect(() => {
        if (!user) return;

        const handleNewAlert = (alert: Alert) => {
            if (processedAlertIds.current.has(alert.orderData.orderId)) return;
            processedAlertIds.current.add(alert.orderData.orderId);

            const newAlert = { ...alert, read: false };

            setAlerts(prev => {
                if (prev.some(a => a.orderData.orderId === newAlert.orderData.orderId)) return prev;
                return [newAlert, ...prev];
            });

            // Show notification
            if (Notification.permission === 'granted') {
                new Notification(alert.title, {
                    body: alert.message,
                    icon: logo,
                });
            }

            // Auto-open modal for urgent alerts
            if (alert.priority === 'urgent') {
                setIsModalOpen(true);
            }
        };

        const handleBatchAlerts = (data: { alerts: Alert[] }) => {
            const alertAttempt = sessionStorage.getItem("alertAttempt") ?? "0";
            const newUniqueAlerts = data.alerts.filter(a => !processedAlertIds.current.has(a.orderData.orderId));
            if (newUniqueAlerts.length === 0) return;

            newUniqueAlerts.forEach(a => processedAlertIds.current.add(a.orderData.orderId));

            const newAlerts = newUniqueAlerts.map(a => ({ ...a, read: false }));

            setAlerts(prev => {
                const existingIds = new Set(prev.map(a => a.orderData.orderId));
                const uniqueNew = newAlerts.filter(a => !existingIds.has(a.orderData.orderId));
                if (uniqueNew.length === 0) return prev;
                return [...uniqueNew, ...prev];
            });

            if (Number(alertAttempt) <= 6) {
                playAlertSound();
                sessionStorage.setItem("alertAttempt", String(Number(alertAttempt) + 1));
            }

            if (Notification.permission === 'granted') {
                new Notification(data.alerts[0].title, {
                    body: data.alerts[0].message,
                    icon: logo,
                });
            }

        };

        socketManager.on("order-alerts", 'order_alert', handleNewAlert);
        socketManager.on("order-alerts", 'order_alerts_batch', handleBatchAlerts);

        return () => {
            socketManager.off("order-alerts", 'order_alert');
            socketManager.off("order-alerts", 'order_alerts_batch');
        };
    }, [user, socketManager]);

    const acknowledgeAlert = (alertId: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        socketManager.emit("order-alerts", 'acknowledge_alert', {
            alertId,
            userId: user?.id,
            restaurantId: user?.restaurantId,
        });
        setAlerts(prev => prev.filter(a => a.id !== alertId));
    };

    const viewOrder = (alert: Alert) => {
        acknowledgeAlert(alert.id);
        handleNavigation(alert);
        setIsModalOpen(false);
    };

    const handleNavigation = (alert: Alert) => {
        switch (alert.type) {
            case 'pending_confirmation':
                if (user?.restaurant?.requireWaiterConfirmation) {
                    navigate(RouteLinks.WAITER_CONFIRMATION);
                } else {
                    navigate(RouteLinks.KITCHEN);
                }
                break;
            case 'order_overtime':
                navigate(RouteLinks.KITCHEN);
                break;
            default:
                break;
        }
    }

    const unreadCount = alerts.filter(a => !a.read).length;

    const getPriorityStyles = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return 'bg-red-50 border-l-4 border-red-500 text-red-900';
            case 'high':
                return 'bg-orange-50 border-l-4 border-orange-500 text-orange-900';
            case 'medium':
                return 'bg-yellow-50 border-l-4 border-yellow-500 text-yellow-900';
            default:
                return 'bg-gray-50 border-l-4 border-gray-500 text-gray-900';
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'urgent':
                return <AlertTriangle className="w-5 h-5 text-red-500" />;
            case 'high':
                return <AlertTriangle className="w-5 h-5 text-orange-500" />;
            default:
                return <Bell className="w-5 h-5 text-gray-500" />;
        }
    };

    if (!user) return null;

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={() => setIsModalOpen(true)}
                className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all hover:scale-110 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 ${unreadCount > 0
                    ? 'bg-red-600 text-white ring-4 ring-offset-2 ring-red-100 shadow-red-500/50'
                    : 'bg-white text-gray-700'
                    }`}
            >
                <div className="relative">
                    <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'animate-swing' : ''}`} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-sm animate-pulse">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </div>
            </button>

            {/* Alerts Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Bell className="w-5 h-5 text-blue-600" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                </span>
                            )}
                        </div>
                        <span>Notifications</span>
                        <span className="text-sm font-normal text-gray-500 ml-2">
                            ({alerts.length} active)
                        </span>
                    </div>
                }
                size="md"
            >
                {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                        <div className="bg-gray-50 p-4 rounded-full mb-4">
                            <Bell className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="font-medium">No new alerts</p>
                        <p className="text-sm mt-1">You're all caught up!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {alerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`relative overflow-hidden rounded-lg p-4 transition-all hover:shadow-md ${getPriorityStyles(alert.priority)}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="shrink-0 mt-0.5">
                                        {getPriorityIcon(alert.priority)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <h4 className="font-bold text-sm leading-tight pr-6">
                                                {alert.title}
                                            </h4>
                                            <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider opacity-70 whitespace-nowrap">
                                                <Clock className="w-3 h-3" />
                                                {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        <p className="text-sm mt-1 opacity-90 leading-relaxed">
                                            {alert.message}
                                        </p>

                                        {alert.orderData && (
                                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium opacity-80">
                                                <span className="px-2 py-0.5 rounded-full bg-black/5 whitespace-nowrap">
                                                    Order #{alert.orderData.orderNumber}
                                                </span>
                                                <span className="px-2 py-0.5 rounded-full bg-black/5 whitespace-nowrap">
                                                    {alert.orderData.orderType}
                                                </span>
                                                {alert.orderData.waitingTime && (
                                                    <span className="px-2 py-0.5 rounded-full bg-black/5 whitespace-nowrap">
                                                        Wait: {alert.orderData.waitingTime}m
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-end gap-2 border-t border-black/5 pt-3">
                                    <button
                                        onClick={(e) => acknowledgeAlert(alert.id, e)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md hover:bg-black/5 transition-colors"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                        Dismiss
                                    </button>
                                    <button
                                        onClick={() => viewOrder(alert)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md bg-white/50 hover:bg-white shadow-sm transition-all"
                                    >
                                        <Eye className="w-3.5 h-3.5" />
                                        View Order
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </>
    );
};
