import React, { useLayoutEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { calculateItemsTotalRequest } from '../features/Cart/cartSlice';
import BottomSheet from '../components/BottomSheet';
import EnterUserDetailSection from '../sections/EnterUserDetailSection';
import Header from '../components/Header';
import { AppDispatch, RootState } from '../app/store';
import { Button } from '../components/Button';
import { formatPrice } from '../utils';
import { ShoppingBag, Store, Plus } from 'lucide-react';
import { resetCustomerState } from '../features/Customer/customerSlice';
import useRestaurant from '../hooks/useRestaurant';
import { RootLinks } from '../routers/types';
import { resetOrderState } from '../features/Order/orderSlice';
import { Item } from '../features/Cart/types';
import { CustomerOTPRequest } from '../features/Customer/types';
import EnterVehicleDetailSection from '../sections/EnterVehicleDetailSection';
import { OrderType } from '../utils/Constant';

const ReviewFoodCourtOrder: React.FC = () => {

    const { orderType, setPhoneNumber, setCustomerName, setVehicleDetail } = useRestaurant();

    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    const { calculateItemsTotalResponse, loading } = useSelector((state: RootState) => state.cart);
    const { customer } = useSelector((state: RootState) => state.customer);
    const { order } = useSelector((state: RootState) => state.order);
    const [bottomSheetStep, setBottomSheetStep] = useState<'vehicle' | 'user'>('vehicle');

    const [isBottomSheetOpen, setBottomSheetOpen] = useState<boolean>(false);

    useLayoutEffect(() => {
        dispatch(calculateItemsTotalRequest());
    }, [dispatch]);

    useLayoutEffect(() => {
        return () => {
            dispatch(resetCustomerState());
        }
    }, [customer, dispatch]);

    useLayoutEffect(() => {
        if (order) {
            navigate(`${RootLinks.ORDERSUMMARY}/${order?.id}`);
        }
    }, [order, navigate])

    const handleConfirm = () => {
        dispatch(resetOrderState());
        setBottomSheetOpen(true);
    };

    const handleOrder = () => {
        navigate(RootLinks.OTPVERIFICATION, { state: { existingOrder: false } });
    };

    const handleCloseBottomSheet = () => {
        setBottomSheetOpen(false);
    };

    const handleSubmitPhone = (customer?: CustomerOTPRequest) => {
        if (!customer) return;
        setPhoneNumber(customer.phoneNumber);
        setCustomerName(customer.name);
        setBottomSheetOpen(false);
        handleOrder();
    };

    const handleVehicleConfirm = (details: { vehicleModel: string; vehicleNumber: string }) => {
        setVehicleDetail(details);
        setBottomSheetStep('user');
    };

    const handleAddMoreItems = () => {
        navigate(RootLinks.RESTAURANTLIST);
    };

    const filterSpecialInstructions = (item: Item) => {
        return item.specialInstructions?.instructions?.trim().length > 0 ? item.specialInstructions?.instructions.trim() : "No special instructions";
    };

    const itemsByRestaurant = calculateItemsTotalResponse?.itemsByRestaurant ?? [];
    const totalAmount = Number(calculateItemsTotalResponse?.totalAmount ?? 0);
    const itemCount = calculateItemsTotalResponse?.itemCount ?? 0;

    // Loading state with skeleton
    if (loading && !calculateItemsTotalResponse) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header title="Review Order" />

                <div className="p-4 pb-60 space-y-6 mt-16 flex flex-col flex-1 max-w-4xl mx-auto">
                    {/* Summary Header Skeleton */}
                    <div className="bg-gray-200 rounded-2xl p-6 shadow-lg animate-pulse">
                        <div className="flex justify-between items-center">
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-300 rounded w-32"></div>
                                <div className="h-8 bg-gray-300 rounded w-24"></div>
                            </div>
                            <div className="space-y-2 text-right">
                                <div className="h-4 bg-gray-300 rounded w-20 ml-auto"></div>
                                <div className="h-8 bg-gray-300 rounded w-28"></div>
                            </div>
                        </div>
                    </div>

                    {/* Restaurant Cards Skeleton */}
                    <div className="space-y-4">
                        {[1, 2].map((index) => (
                            <div key={index} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm animate-pulse">
                                {/* Restaurant Header Skeleton */}
                                <div className="bg-gray-100 px-5 py-4 border-b border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                                            <div className="space-y-2">
                                                <div className="h-5 bg-gray-300 rounded w-32"></div>
                                                <div className="h-4 bg-gray-300 rounded w-20"></div>
                                            </div>
                                        </div>
                                        <div className="text-right space-y-2">
                                            <div className="h-4 bg-gray-300 rounded w-16 ml-auto"></div>
                                            <div className="h-5 bg-gray-300 rounded w-20"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Items Skeleton */}
                                <div className="divide-y divide-gray-100">
                                    {[1, 2].map((itemIndex) => (
                                        <div key={itemIndex} className="p-4">
                                            <div className="flex gap-4">
                                                {/* Image Skeleton */}
                                                <div className="w-20 h-20 bg-gray-200 rounded-xl shrink-0"></div>

                                                {/* Details Skeleton */}
                                                <div className="flex-1 space-y-3">
                                                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                                                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                                    <div className="flex items-center justify-between">
                                                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                                                        <div className="space-y-1">
                                                            <div className="h-3 bg-gray-200 rounded w-16 ml-auto"></div>
                                                            <div className="h-5 bg-gray-200 rounded w-20"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Skeleton */}
                <footer className="fixed bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-2xl">
                    <div className="max-w-4xl mx-auto p-4 sm:p-6 animate-pulse">
                        <div className="bg-gray-100 rounded-xl p-4 mb-4">
                            <div className="h-5 bg-gray-200 rounded w-32 mb-3"></div>
                            <div className="h-px bg-gray-200 my-2"></div>
                            <div className="h-7 bg-gray-200 rounded w-40"></div>
                        </div>
                        <div className="h-14 bg-gray-200 rounded-2xl"></div>
                    </div>
                </footer>
            </div>
        );
    }

    // Empty cart state
    if (itemCount === 0) {
        return (
            <div className="min-h-screen bg-linear-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-24 h-24 bg-linear-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShoppingBag className="w-12 h-12 text-orange-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Cart is Empty</h2>
                    <p className="text-gray-600 mb-6">Add items from different restaurants to get started!</p>
                    <Button
                        onClick={() => navigate(RootLinks.MENU)}
                        className="w-full"
                    >
                        Browse Menu
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header title="Review Order" />

            <div className="p-4 pb-80 space-y-6 mt-16 flex flex-col flex-1 max-w-4xl mx-auto">

                {/* Order Summary Header */}
                <div className="bg-linear-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-orange-100 text-sm font-medium mb-1">Food Court Order</p>
                            <h2 className="text-2xl font-bold">{itemCount} {itemCount === 1 ? 'Item' : 'Items'}</h2>
                        </div>
                        <div className="text-right">
                            <p className="text-orange-100 text-sm font-medium mb-1">Total</p>
                            <h2 className="text-2xl font-bold">{formatPrice(totalAmount)}</h2>
                        </div>
                    </div>
                </div>

                {/* Items Grouped by Restaurant */}
                <div className="space-y-4">
                    {itemsByRestaurant.map((restaurant) => (
                        <div key={restaurant.restaurantId} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                            {/* Restaurant Header */}
                            <div className="bg-linear-to-r from-orange-50 to-red-50 px-5 py-4 border-b border-orange-100">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-linear-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center">
                                            <Store className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">{restaurant.restaurantName}</h3>
                                            <p className="text-sm text-gray-600">{restaurant.items.length} {restaurant.items.length === 1 ? 'item' : 'items'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600 font-medium">Subtotal</p>
                                        <p className="text-lg font-bold text-orange-600">{formatPrice(restaurant.subtotal)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Restaurant Items */}
                            <div className="divide-y divide-gray-100">
                                {restaurant.items.map((item) => (
                                    <div key={item.menuId} className="p-4">
                                        <div className="flex gap-4">
                                            {/* Item Image */}
                                            {item.image && (
                                                <div className="w-20 h-20 shrink-0 overflow-hidden rounded-xl ring-2 ring-gray-100">
                                                    <img
                                                        src={item.image}
                                                        alt={item.menuName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )}

                                            {/* Item Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-4 mb-1">
                                                    <h4 className="font-bold text-gray-900 text-base">{item.menuName}</h4>
                                                </div>

                                                {(item.specialInstructions?.variants?.length > 0 || (item.selectedAddons && item.selectedAddons.length > 0)) && (
                                                    <div className="flex flex-col gap-1.5 mb-3">
                                                        {item.specialInstructions?.variants?.length > 0 && (
                                                            <div className="flex flex-wrap gap-1">
                                                                {item.specialInstructions.variants.map((variant: any, idx: number) => (
                                                                    <div key={idx} className="flex flex-wrap gap-1">
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

                                                        {item.selectedAddons && item.selectedAddons.length > 0 && (
                                                            <div className="flex flex-wrap gap-1">
                                                                {item.selectedAddons.map((addon: any, idx: number) => (
                                                                    <span
                                                                        key={idx}
                                                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200"
                                                                    >
                                                                        + {addon.addonName || addon.name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Special Instructions */}
                                                {item.specialInstructions && Object.keys(item.specialInstructions).length > 0 && (
                                                    <p className="text-xs text-gray-500 italic mb-3">
                                                        Note: {filterSpecialInstructions(item)}
                                                    </p>
                                                )}

                                                {/* Quantity and Price (Read-only) */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-gray-600">Qty:</span>
                                                        <span className="text-base font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">
                                                            {item.quantity}
                                                        </span>
                                                    </div>

                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500">{formatPrice(item.unitPrice)} each</p>
                                                        <p className="text-lg font-bold text-gray-900">{formatPrice(item.totalPrice)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Fixed Footer with Total and Checkout */}
            <footer className="fixed bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-md border-t border-orange-100 shadow-2xl z-50">
                <div className="max-w-4xl mx-auto p-4 sm:p-6">
                    {/* Total Summary */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-gray-600 font-medium">Items ({itemCount})</span>
                            <span className="text-gray-900 font-semibold">{formatPrice(totalAmount)}</span>
                        </div>
                        <div className="h-px bg-gray-200 my-2"></div>
                        <div className="flex justify-between items-center">
                            <span className="text-lg font-bold text-gray-900">Total</span>
                            <span className="text-2xl font-bold text-orange-600">{formatPrice(totalAmount)}</span>
                        </div>
                    </div>

                    {/* New Order Button */}
                    <Button
                        onClick={handleAddMoreItems}
                        size="lg"
                        variant="secondary"
                        className="relative w-full group/btn overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] mb-3.5"
                    >
                        <div className='rounded-full bg-gray-200 px-2'>  <Plus className="w-5 h-5 text-gray-400" /></div>
                        <span className="text-gray-400 font-semibold">Add More Items</span>
                    </Button>

                    {/* Checkout Button */}
                    <Button
                        onClick={handleConfirm}
                        size="lg"
                        className="relative w-full group/btn overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-xl hover:shadow-2xl"
                    >
                        <span className="text-white font-medium tracking-wide sm:text-lg">
                            Proceed to Checkout
                        </span>
                    </Button>
                </div>
            </footer>

            {/* Bottom Sheet for Customer Details */}
            <BottomSheet isOpen={isBottomSheetOpen} onClose={handleCloseBottomSheet}>
                {bottomSheetStep === 'vehicle' && orderType === OrderType.PARKING ? (
                    <EnterVehicleDetailSection onConfirm={handleVehicleConfirm} />
                ) : (
                    <EnterUserDetailSection onConfirm={handleSubmitPhone} />
                )}
            </BottomSheet>
        </div>
    );
};

export default ReviewFoodCourtOrder;
