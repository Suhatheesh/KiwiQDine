import React, { useMemo } from 'react';
import { CheckCircle2, TrendingUp, Star, Store } from 'lucide-react';
import { formatPrice } from '../utils';
import Header from '../components/Header';
import { format } from 'date-fns';
import { Button } from '../components/Button';
import { useNavigate, useLocation } from 'react-router-dom';
import { RootLinks } from '../routers/types';
import { OrderStatusTypes, RestaurantType } from '../utils/Constant';
import { OrderSuccessResponse, SpecialInstructions } from '../features/Order/types';
import useRestaurant from '../hooks/useRestaurant';

const FoodCourtOrderSummary: React.FC = () => {

    const { restaurantType } = useRestaurant();
    const navigate = useNavigate();
    const location = useLocation();

    const { cartOrder } = location.state as { cartOrder: OrderSuccessResponse[] };

    const firstOrder = cartOrder?.[0];

    const formattedDate = firstOrder?.createdAt ? format(new Date(firstOrder.createdAt), 'MMM dd, yyyy') : '';
    const formattedTime = firstOrder?.createdAt ? format(new Date(firstOrder.createdAt), 'hh:mm a') : '';

    const totalAmount = useMemo(() => {
        return cartOrder?.reduce((sum, order) => sum + parseFloat(order.totalAmount || '0'), 0) || 0;
    }, [cartOrder]);

    const totalItemCount = useMemo(() => {
        return cartOrder?.reduce((count, order) => {
            return count + (order.items?.reduce((catCount, cat) => catCount + cat.items.length, 0) || 0);
        }, 0) || 0;
    }, [cartOrder]);

    const handleTrackOrder = () => {
        if (cartOrder?.length > 1) {
            navigate(RootLinks.ONGOINGORDERS);
        } else {
            navigate(`${RootLinks.ORDERSTATUS}/${firstOrder?.id}`);
        }
    };

    const handleReview = () => {
        if (firstOrder?.id) {
            navigate(`${RootLinks.REVIEW}/${firstOrder.id}/${firstOrder.customer.id}`);
        }
    };

    const filterSpecialInstructions = (item: SpecialInstructions) => {
        const specialInstructions = item as { [key: string]: string };
        if (Object.keys(specialInstructions).some(key => key === "note")) {
            return specialInstructions?.note.trim().length > 0 ? specialInstructions?.note.trim() : "No special instructions";
        }
        return "No special instructions";
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-gray-50">
            <div className="relative z-10 w-full flex flex-col min-h-screen">

                {/* Header */}
                <Header showBackButton={false} title={cartOrder.some(order => order.paymentStatus?.toUpperCase() === "PAID") ? "Order Summary" : "Waiting for cashier confirmation"} />

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
                                Your order has been sent to {cartOrder?.length || 0} {cartOrder?.length === 1 ? 'kitchen' : 'kitchens'} and is being prepared with care.
                            </p>
                        </div>
                    </div>

                    {/* Order Metadata */}
                    <div className="flex flex-1 items-center justify-between mb-6">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">{cartOrder?.length || 0} {cartOrder?.length === 1 ? 'Order' : 'Orders'}</p>
                            <p className="font-bold text-gray-900">{firstOrder?.orderNumber ? `#${firstOrder.orderNumber}` : ''}</p>
                        </div>
                        <p className="font-medium text-gray-900">{formattedDate} {formattedTime}</p>
                    </div>

                    {/* Items Grouped by Restaurant (Each Order) */}
                    <div className="space-y-4">
                        {cartOrder?.map((order, orderIndex) => (
                            <div key={orderIndex} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                                {/* Restaurant Header */}
                                <div className="bg-linear-to-r from-orange-50 to-red-50 px-5 py-4 border-b border-orange-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-linear-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center">
                                                <Store className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg">{order.restaurant?.name || 'Restaurant'}</h3>
                                                <p className="text-sm text-gray-600">
                                                    Order #{order.orderNumber} • {order.items?.reduce((count, cat) => count + cat.items.length, 0) || 0} items
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-gray-600 font-medium">Subtotal</p>
                                            <p className="text-lg font-bold text-orange-600">{formatPrice(parseFloat(order.totalAmount || '0'))}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Restaurant Items */}
                                <div className="divide-y divide-gray-100">
                                    {order.items?.map((category, catIndex) => (
                                        <div key={catIndex}>
                                            {category.items?.map((item, itemIndex) => (
                                                <div
                                                    key={itemIndex}
                                                    className="flex items-start p-4"
                                                >
                                                    {/* Quantity Badge */}
                                                    <div className="shrink-0 mr-4">
                                                        <div className="w-10 h-10 bg-linear-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center border-2 border-orange-200">
                                                            <span className="text-sm font-bold text-orange-700">{item.quantity}x</span>
                                                        </div>
                                                    </div>

                                                    {/* Item Details */}
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-gray-900 leading-tight">{item.menuName}</h4>

                                                        {((item.specialInstructions && (item.specialInstructions as any).variants?.length > 0) || (item.addons && item.addons.length > 0)) && (
                                                            <div className="flex flex-col gap-1.5 my-1.5">
                                                                {item.specialInstructions && (item.specialInstructions as any).variants?.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {(item.specialInstructions as any).variants.map((variant: any, vIdx: number) => (
                                                                            <div key={vIdx} className="flex flex-wrap gap-1">
                                                                                {variant.options?.map((option: any, optIdx: number) => (
                                                                                    <span
                                                                                        key={optIdx}
                                                                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-50 text-orange-700 border border-orange-200"
                                                                                    >
                                                                                        {option.name}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        ))}
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

                                                        {item.specialInstructions && (
                                                            <p className="text-xs text-gray-500 mt-1 italic">
                                                                Note: {filterSpecialInstructions(item.specialInstructions)}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Price */}
                                                    <div className="shrink-0 text-right">
                                                        <p className="font-bold text-lg text-gray-900">
                                                            {formatPrice(parseFloat(item.totalPrice || '0'))}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Enhanced Sticky Footer */}
                <footer className={`fixed ${restaurantType === RestaurantType.RESTAURANT ? 'bottom-0' : 'bottom-20'} left-0 right-0 w-full p-4 sm:p-6 bg-white/95 backdrop-blur-md border-t border-orange-100 shadow-2xl z-50`}>
                    <div className="max-w-4xl mx-auto">
                        {/* Order Summary */}
                        <div className="pb-4 space-y-3 mb-4 border-b border-gray-200">
                            <div className="flex justify-between text-base">
                                <span className="text-gray-600">Total Items</span>
                                <span className="font-semibold text-gray-800">{totalItemCount} items</span>
                            </div>
                            <div className="flex justify-between text-base">
                                <span className="text-gray-600">Payment Method</span>
                                <span className="font-semibold text-gray-800 capitalize">{firstOrder?.paymentMethod || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between text-base">
                                <span className="text-gray-600">Payment Status</span>
                                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold capitalize">
                                    {firstOrder?.paymentStatus || 'N/A'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-lg pt-3 font-black border-t border-gray-200">
                                <span className="text-gray-900">Total Paid</span>
                                <span className="bg-linear-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
                                    {formatPrice(totalAmount)}
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            {(firstOrder?.status === OrderStatusTypes.SERVED || firstOrder?.status === OrderStatusTypes.COMPLETED) && (
                                <Button className="grow" variant='secondary' onClick={handleReview}>
                                    <div className="flex items-center justify-center gap-2 py-2">
                                        <Star className="w-5 h-5" />
                                        <span>Rate Experience</span>
                                    </div>
                                </Button>
                            )}
                            <Button className="grow" onClick={handleTrackOrder}>
                                <div className="relative flex items-center justify-center gap-2">
                                    <TrendingUp className="w-5 h-5" />
                                    <span>Track Order</span>
                                </div>
                            </Button>
                        </div>
                    </div>
                </footer>

            </div>
        </div>
    );
};

export default FoodCourtOrderSummary;
