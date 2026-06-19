import React, { useEffect, useMemo } from 'react';
import { CheckCircle2, UtensilsCrossed, Bell, CheckCircle, RotateCw } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../app/store';
import { fetchOrderByIdRequest, resetOrderState, updateOrderFromWebSocket } from '../features/Order/orderSlice';
import useRestaurant from '../hooks/useRestaurant';
import Header from '../components/Header';
import OrderItemCard from '../components/OrderItemCard';
import { format } from 'date-fns';
import SocketService from '../services/SocketService';
import { Button } from '../components/Button';
import { OrderStatusTypes, OrderType, PaymentTiming } from '../utils/Constant';
import { RootLinks } from '../routers/types';
import { apiBaseUrl } from '../api/axiosClient';
import { formatPrice } from '../utils';
import { OrderStatusUpdate } from '../features/Order/types';
import { resetStates } from '../features/Payment/paymentSlice';

const OrderStatus: React.FC = () => {
    const { orderId } = useParams();
    const { phone, paymentTiming, orderType } = useRestaurant();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const { order, loading } = useSelector((state: RootState) => state.order);
    const accessToken = sessionStorage.getItem('accessToken');

    const statusSteps = useMemo(() => {
        const baseSteps = [
            {
                status: OrderStatusTypes.CONFIRMED,
                label: 'Confirmed',
                icon: <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />,
                description: 'Order received'
            },
            {
                status: OrderStatusTypes.PREPARING,
                label: 'Preparing',
                icon: <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6" />,
                description: 'Kitchen is cooking'
            },
            {
                status: OrderStatusTypes.READY,
                label: 'Ready',
                icon: <Bell className="w-5 h-5 sm:w-6 sm:h-6" />,
                description: 'Ready to serve'
            }
        ];

        if (orderType === OrderType.TAKEAWAY) {
            baseSteps.push({
                status: OrderStatusTypes.COMPLETED,
                label: 'Completed',
                icon: <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />,
                description: 'Order completed'
            });
        } else {
            baseSteps.push({
                status: OrderStatusTypes.SERVED,
                label: 'Served',
                icon: <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />,
                description: 'Enjoy your meal'
            });
        }
        return baseSteps;
    }, [orderType]);

    useEffect(() => {
        if (orderId && phone) {
            dispatch(fetchOrderByIdRequest({ orderId, phone }));
        }
    }, [dispatch, orderId, phone]);

    useEffect(() => {
        if (!accessToken) return;

        const socket = SocketService.getInstance();

        socket.connect(
            `${apiBaseUrl.replace("https", "wss")}`,
            { auth: { token: accessToken } }
        );

        return () => {
            socket.disconnect();
        };
    }, [accessToken, apiBaseUrl]);

    useEffect(() => {
        if (!orderId || !order?.customer?.id) return;

        const socket = SocketService.getInstance();

        const onOrderStatusUpdate = (data: OrderStatusUpdate) => {
            console.log(data);

            if (order.id === orderId) {
                dispatch(updateOrderFromWebSocket(data.order));
            }
        };

        socket.emit("subscribe_customer_order", {
            orderId,
            customerId: order.customer.id,
        });

        socket.on("order_status_update", onOrderStatusUpdate);
        socket.on("order_update", handleRefresh);

        return () => {
            socket.off("order_status_update", onOrderStatusUpdate);
            socket.off("order_update", handleRefresh);
            socket.emit("unsubscribe_customer_order", { orderId });
        };
    }, [orderId, order?.customer?.id, dispatch]);

    const formattedDate = order?.createdAt ? format(new Date(order.createdAt), 'dd/MM/yyyy') : '';
    const formattedTime = order?.createdAt ? format(new Date(order.createdAt), 'hh:mm a') : '';

    const currentStatus = (order?.status?.toLowerCase() as OrderStatusTypes) || OrderStatusTypes.CONFIRMED;
    const currentStepIndex = useMemo(() => {
        const index = statusSteps.findIndex(step => step.status === currentStatus);
        if (index === -1 && currentStatus === OrderStatusTypes.COMPLETED) return statusSteps.length - 1;
        return index;
    }, [statusSteps, currentStatus]);

    const getStepStatus = (index: number) => {
        if (currentStatus === OrderStatusTypes.COMPLETED) return 'completed';
        if (index < currentStepIndex) return 'completed';
        if (index === currentStepIndex) return 'current';
        return 'pending';
    };

    const shouldShowPaymentFooter =
        (currentStatus === OrderStatusTypes.SERVED || currentStatus === OrderStatusTypes.COMPLETED) &&
        paymentTiming === PaymentTiming.PAY_AT_LAST &&
        orderType === OrderType.DINEIN &&
        order?.paymentStatus !== 'paid';

    const handlePay = () => {
        dispatch(resetStates());
        dispatch(resetOrderState());
        navigate(`${RootLinks.FINALISEORDER}/${orderId}/${order?.totalAmount}`);
    };

    const handleRefresh = () => {
        if (orderId && phone) {
            dispatch(fetchOrderByIdRequest({ orderId, phone }));
        }
    };

    return (
        <div className="bg-[#fcfdfe] min-h-screen font-sans antialiased text-[#1a1c1e]">
            <Header title="Order Status" showBackButton={true} />

            <div className={`p-4 sm:p-6 md:p-8 mt-16 max-w-2xl mx-auto w-full flex flex-col gap-6 ${shouldShowPaymentFooter ? 'pb-64' : 'pb-6'}`}>

                {/* 1. Order Detail Card */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-2">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                {order?.orderNumber}
                            </h2>
                            <div className="flex items-center gap-4 text-xs font-semibold text-gray-600">
                                <span>Table {order?.tableNo}</span>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-400">
                                <span>{formattedDate} at {formattedTime}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500 mb-1">Total Amount</p>
                            <p className="text-lg font-bold bg-linear-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                                {formatPrice(parseFloat(order?.totalAmount || '0'))}
                            </p>
                        </div>
                    </div>

                    {/* Payment Information */}
                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Payment Method:</span>
                            <span className="text-sm font-semibold text-gray-900 capitalize">
                                {order?.paymentMethod || 'Not Selected'}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Status:</span>
                            <span className={`
                                px-3 py-1 rounded-full text-xs font-semibold capitalize
                                ${order?.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : ''}
                                ${order?.paymentStatus === 'pending' ? 'bg-orange-100 text-orange-700' : ''}
                                ${!order?.paymentStatus || (order?.paymentStatus !== 'paid' && order?.paymentStatus !== 'pending') ? 'bg-gray-100 text-gray-700' : ''}
                            `}>
                                {order?.paymentStatus || 'Not Selected'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. Order Status Journey */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-2">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold text-gray-900">Order Progress</h3>
                        <button
                            onClick={handleRefresh}
                            disabled={loading}
                            className="p-2 hover:bg-gray-50 rounded-full transition-all duration-200 active:scale-95 disabled:opacity-50 group"
                            title="Refresh Status"
                        >
                            <RotateCw className={`w-5 h-5 text-gray-500 group-hover:text-orange-500 transition-colors ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className="relative">
                        {/* Progress Line */}
                        <div className="absolute top-12 left-0 right-0 h-1 bg-gray-200 -z-10" style={{ left: '2rem', right: '2rem' }} />
                        <div
                            className="absolute top-12 left-0 h-1 bg-linear-to-r from-orange-500 to-red-500 -z-10 transition-all duration-500"
                            style={{
                                left: '2rem',
                                width: `calc(${(currentStepIndex / (statusSteps.length - 1)) * 100}% - 4rem)`
                            }}
                        />

                        {/* Steps */}
                        <div className="grid grid-cols-4 gap-4">
                            {statusSteps.map((step, index) => {
                                const status = getStepStatus(index);
                                const isCompleted = status === 'completed';
                                const isCurrent = status === 'current';

                                return (
                                    <div key={step.status} className="flex flex-col items-center">
                                        {/* Icon Circle */}
                                        <div className={`
                                            w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-3 transition-all duration-300
                                            ${isCompleted ? 'bg-linear-to-br from-orange-500 to-red-500 text-white shadow-lg scale-100' : ''}
                                            ${isCurrent ? 'bg-linear-to-br from-orange-500 to-red-500 text-white shadow-xl scale-110 animate-pulse' : ''}
                                            ${status === 'pending' ? 'bg-gray-100 text-gray-400' : ''}
                                        `}>
                                            {step.icon}
                                        </div>

                                        {/* Label */}
                                        <h4 className={`
                                            text-sm sm:text-base font-bold text-center mb-1
                                            ${isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'}
                                        `}>
                                            {step.label}
                                        </h4>

                                        {/* Description */}
                                        <p className={`
                                            text-xs text-center
                                            ${isCompleted || isCurrent ? 'text-gray-600' : 'text-gray-400'}
                                        `}>
                                            {step.description}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Current Status Message */}
                    <div className="mt-8 p-4 bg-orange-50 border border-orange-200 rounded-xl">
                        <p className="text-center text-gray-700">
                            {currentStatus === 'confirmed' && '🎉 Your order has been confirmed and sent to the kitchen!'}
                            {currentStatus === 'preparing' && '👨‍🍳 Our chefs are preparing your delicious meal!'}
                            {currentStatus === 'ready' && '🔔 Your order is ready! We\'ll serve it shortly.'}
                            {currentStatus === 'served' && '✨ Enjoy your meal! Bon appétit!'}
                            {currentStatus === 'completed' && '✨ Order completed! Bon appétit!'}
                        </p>
                    </div>
                </div>

                {/* 4. Items Breakdown Section */}
                <div className="space-y-4">
                    {/* Handle Categorized Items */}
                    {order?.itemsByCategory?.map((category, catIndex) => (
                        <div key={`cat-${catIndex}`} className="p-2 sm:p-4">
                            <div className="flex items-center justify-between pb-4 border-b border-[#f8fafc]">
                                <h3 className="text-xl font-black text-black">
                                    {category.category || 'Order Content'}
                                </h3>
                                <div className="bg-[#f8fafc] text-[#64748b] px-3 py-1 rounded-full text-base font-black">
                                    {(category.items?.length || 0)} {category.items?.length === 1 ? 'ITEM' : 'ITEMS'}
                                </div>
                            </div>

                            <div className="grid gap-4">
                                {category.items?.map((item, itemIndex) => (
                                    <OrderItemCard key={itemIndex} item={item} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Review Button - Show when order is served/completed */}
                {(currentStatus === OrderStatusTypes.SERVED || currentStatus === OrderStatusTypes.COMPLETED) && !order?.isReviewed && (
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mt-2">
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-gray-900 mb-2">
                                How was your experience?
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Share your feedback and help us serve you better
                            </p>
                            <Button
                                variant="secondary"
                                onClick={() => navigate(`${RootLinks.REVIEW}/${orderId}/${order?.customer.id}`)}
                                className="w-full sm:w-auto"
                            >
                                <span className="flex items-center gap-2">
                                    <span>⭐</span>
                                    <span>Leave a Review</span>
                                </span>
                            </Button>
                        </div>
                    </div>
                )}

                {shouldShowPaymentFooter && (
                    <footer className="fixed bottom-0 left-0 right-0 w-full p-4 sm:p-6 bg-white/95 backdrop-blur-md border-t border-orange-100 shadow-2xl mt-auto z-50">
                        <div className="max-w-3xl mx-auto">
                            <Button
                                onClick={handlePay}
                                disabled={order?.paymentStatus === 'paid'}
                                size="lg"
                                className="relative w-full group/btn overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-xl hover:shadow-2xl"
                            >
                                <span className="text-white font-medium tracking-wide sm:text-lg">
                                    Make Payment
                                </span>
                            </Button>

                            <p className="text-center text-sm text-gray-500 mt-3">
                                By making payment, you can collect your order
                            </p>
                        </div>
                    </footer>
                )}

            </div>
        </div>
    );
};

export default OrderStatus;
