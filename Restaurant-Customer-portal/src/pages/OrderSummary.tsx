import React, { useLayoutEffect } from 'react';
import { CheckCircle2, TrendingUp, Star } from 'lucide-react';
import { formatPrice } from '../utils';
import Header from '../components/Header';
import { useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../app/store';
import { format } from 'date-fns';
import { Button } from '../components/Button';
import { useNavigate, useParams } from 'react-router-dom';
import useRestaurant from '../hooks/useRestaurant';
import { fetchOrderByIdRequest } from '../features/Order/orderSlice';
import { useDispatch } from 'react-redux';
import { RootLinks } from '../routers/types';
import { OrderStatusTypes, OrderType, PaymentTiming } from '../utils/Constant';

const OrderSummary: React.FC = () => {

    const { orderId } = useParams();
    const { phone, paymentTiming, orderType } = useRestaurant();

    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    const { order } = useSelector((state: RootState) => state.order);

    useLayoutEffect(() => {
        if (orderId && phone) {
            dispatch(fetchOrderByIdRequest({ orderId, phone }));
        }
    }, [dispatch, phone])

    const formattedDate = order?.createdAt ? format(new Date(order.createdAt), 'MMM dd, yyyy') : '';
    const formattedTime = order?.createdAt ? format(new Date(order.createdAt), 'hh:mm a') : '';

    const handleTrackOrder = () => {
        if (orderId) {
            navigate(`${RootLinks.ORDERSTATUS}/${orderId}`);
        }
    };

    const handleReview = () => {
        if (orderId) {
            navigate(`${RootLinks.REVIEW}/${orderId}/${order?.customer.id}`);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="relative z-10 w-full flex flex-col min-h-screen">

                {/* Header */}
                <Header showBackButton={false} title={order?.paymentStatus?.toUpperCase() === "PAID" ? 'Order Placed' : 'Waiting for cashier confirmation'} />

                {/* Confirmation Content */}
                <div className="flex-1 p-4 sm:p-6 md:p-8 mt-24 mb-80 max-w-4xl mx-auto w-full">

                    {/* Success Animation Section */}
                    <div className="text-center space-y-4 pt-4 mb-8 animate-fade-in">
                        {/* Animated check icon */}
                        <div className='flex items-center justify-center'>
                            <div className='relative'>
                                {/* Pulsing glow */}
                                <div className="absolute inset-0 bg-orange-400 rounded-full blur-2xl opacity-30 animate-pulse" />
                                <div className='relative bg-linear-to-br from-orange-100 to-red-100 rounded-full w-fit p-6 border-4 border-orange-200 shadow-xl'>
                                    <CheckCircle2 className="h-16 w-16 text-orange-600" strokeWidth={2.5} />
                                </div>
                            </div>
                        </div>

                        {/* Success message */}
                        <div className="flex flex-1 flex-col items-center justify-center space-y-2 px-8">
                            <h2 className="text-2xl sm:text-3xl font-extrabold">
                                Thanks for your order!
                            </h2>
                            <p className="text-gray-500 text-base sm:text-lg max-w-md">
                                This section shows the items you ordered, along with quantities and pricing.
                            </p>
                        </div>
                    </div>

                    {/* Order Metadata Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6">

                        <div className='flex flex-1 items-center justify-between'>
                            <p className="font-medium text-gray-900">#{order?.orderNumber}</p>
                            <p className="font-medium text-gray-900">{formattedDate} {formattedTime}</p>
                        </div>

                    </div>

                    {/* Order Items Section */}
                    <div className="space-y-4">

                        <div className="space-y-3">
                            {order?.itemsByCategory?.map((category, catIndex) => (
                                <div key={catIndex} className="space-y-3">
                                    {/* Category Header */}
                                    {category.category && (
                                        <div className="flex items-center gap-2 mt-4 mb-2">
                                            <div className="h-px flex-1 bg-linear-to-r from-transparent via-orange-200 to-transparent" />
                                            <span className="text-sm font-semibold text-orange-600 px-3 py-1 bg-orange-50 rounded-full">
                                                {category.category}
                                            </span>
                                            <div className="h-px flex-1 bg-linear-to-r from-transparent via-orange-200 to-transparent" />
                                        </div>
                                    )}

                                    {category.items?.map((item, itemIndex) => (
                                        <div
                                            key={itemIndex}
                                            className="flex items-center p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300 hover:border-orange-200 group"
                                            style={{ animationDelay: `${(catIndex * category.items.length + itemIndex) * 50}ms` }}
                                        >
                                            {/* Quantity Badge */}
                                            <div className="shrink-0 mr-4">
                                                <div className="w-10 h-10 bg-linear-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center border-2 border-orange-200 group-hover:border-orange-300 transition-colors">
                                                    <span className="text-sm font-bold text-orange-700">{item.quantity}x</span>
                                                </div>
                                            </div>

                                            {/* Item Details */}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-gray-900 leading-tight">{item.menuName}</h4>

                                                {(item.specialInstructions?.portion || (item.addons && item.addons.length > 0)) && (
                                                    <div className="flex flex-col gap-1.5 my-1.5">
                                                        {item.specialInstructions?.portion && (
                                                            <div className="flex flex-wrap">
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-50 text-orange-700 border border-orange-200">
                                                                    Size: {item.specialInstructions.portion}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {item.addons && item.addons.length > 0 && (
                                                            <div className="flex flex-wrap gap-1">
                                                                {item.addons.map((addon, aIdx) => (
                                                                    <span
                                                                        key={aIdx}
                                                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200"
                                                                    >
                                                                        + {addon.addonName || addon.name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {item.specialInstructions?.note && (
                                                    <p className="text-xs text-gray-500 mt-1 italic">
                                                        Note: {item.specialInstructions.note}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Price */}
                                            <div className="shrink-0 text-right">
                                                <p className="font-bold text-lg bg-linear-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                                                    {formatPrice(parseFloat(item.totalPrice || '0'))}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Enhanced Sticky Footer */}
                <footer className="fixed bottom-0 left-0 right-0 w-full p-4 sm:p-6 bg-white/95 backdrop-blur-md border-t border-orange-100 shadow-2xl z-50">
                    <div className="max-w-4xl mx-auto">
                        {/* Order Summary */}
                        <div className="pb-4 space-y-3 mb-4 border-b border-gray-200">
                            <div className="flex justify-between text-base">
                                <span className="text-gray-600">Payment Method</span>
                                <span className="font-semibold text-gray-800 capitalize">{order?.paymentMethod || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-base">
                                <span className="text-gray-600">Payment Status</span>
                                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold capitalize">
                                    {order?.paymentStatus || 'N/A'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-lg pt-3 font-black border-t border-gray-200">
                                <span className="text-gray-900">Total Paid</span>
                                <span className="bg-linear-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
                                    {formatPrice(parseFloat(order?.totalAmount || '0'))}
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            {(order?.status === OrderStatusTypes.SERVED || order?.status === OrderStatusTypes.COMPLETED) && !order?.isReviewed && (
                                <Button className="grow" variant='secondary' onClick={handleReview}>
                                    <div className="flex items-center justify-center gap-2 py-2">
                                        <Star className="w-5 h-5" />
                                        <span>Rate Experience</span>
                                    </div>
                                </Button>
                            )}
                            {(paymentTiming === PaymentTiming.PAY_AT_FIRST || orderType === OrderType.TAKEAWAY || orderType === OrderType.PARKING) && (order?.status !== OrderStatusTypes.SERVED && order?.status !== OrderStatusTypes.COMPLETED) && (
                                <Button className="grow" onClick={handleTrackOrder}>
                                    {/* Shimmer effect */}
                                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-linear-to-r from-transparent via-white/20 to-transparent" />
                                    <div className="relative flex items-center justify-center gap-2">
                                        <TrendingUp className="w-5 h-5" />
                                        <span>Track Order</span>
                                    </div>
                                </Button>
                            )}
                        </div>
                    </div>
                </footer>

            </div>
        </div>
    );
};

export default OrderSummary;