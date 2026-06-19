import React, { useLayoutEffect, useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { deleteCartItemRequest, fetchCartRequest, increseItemQty, reduceItemQty, removeItem, setNotes, updateCartItemRequest } from '../features/Cart/cartSlice';
import ReviewOrderItem from '../components/ReviewOrderItem';
import BottomSheet from '../components/BottomSheet';
import EnterUserDetailSection from '../sections/EnterUserDetailSection';
import { Button } from '../components/Button';
import Header from '../components/Header';
import { ShoppingBag } from 'lucide-react';
import { AppDispatch, RootState } from '../app/store';
import { formatPrice } from '../utils';
import { resetCustomerState } from '../features/Customer/customerSlice';
import useRestaurant from '../hooks/useRestaurant';
import { RootLinks } from '../routers/types';
import { resetOrderState } from '../features/Order/orderSlice';
import { OrderType, RestaurantType } from '../utils/Constant';
import { CustomerOTPRequest } from '../features/Customer/types';
import EnterVehicleDetailSection from '../sections/EnterVehicleDetailSection';

const ReviewOrder: React.FC = () => {

    const { restaurantType, orderType, serviceCharge, setPhoneNumber, setCustomerName, setVehicleDetail } = useRestaurant();

    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    const { cartItem: cartItems, cartResponse } = useSelector((state: RootState) => state.cart);
    const { customer } = useSelector((state: RootState) => state.customer);

    const [orderNotes, setOrderNotes] = useState<string>('');
    const [isBottomSheetOpen, setBottomSheetOpen] = useState<boolean>(false);

    const [bottomSheetStep, setBottomSheetStep] = useState<'vehicle' | 'user'>('vehicle');

    const validateCartItems = restaurantType === RestaurantType.RESTAURANT ? cartItems : cartResponse?.items ?? [];

    useLayoutEffect(() => {
        if (restaurantType === RestaurantType.FOOD_COURT) {
            dispatch(fetchCartRequest());
        }
    }, [dispatch, restaurantType]);

    useLayoutEffect(() => {
        return () => { dispatch(resetCustomerState()); }
    }, [customer]);

    const handleQuantityChange = (id: number, delta: 1 | -1) => {
        if (delta === 1) {
            restaurantType === RestaurantType.RESTAURANT ? dispatch(increseItemQty(id)) :
                dispatch(updateCartItemRequest({ menuId: cartResponse?.items[id].menuId ?? "", quantity: (cartResponse?.items[id].quantity ?? 0) + 1, selectedAddons: cartResponse?.items[id].selectedAddons }));
        } else {
            restaurantType === RestaurantType.RESTAURANT ? dispatch(reduceItemQty(id)) :
                dispatch(updateCartItemRequest({ menuId: cartResponse?.items[id].menuId ?? "", quantity: (cartResponse?.items[id].quantity ?? 0) - 1, selectedAddons: cartResponse?.items[id].selectedAddons }));
        }
    };

    const handleDeleteItem = (index: number) => {
        restaurantType === RestaurantType.RESTAURANT ? dispatch(removeItem(index)) : dispatch(deleteCartItemRequest({ menuId: cartResponse?.items[index].menuId ?? "", selectedAddons: cartResponse?.items[index].selectedAddons }));
    };

    const handleConfirm = () => {
        setBottomSheetStep('vehicle')
        dispatch(setNotes(orderNotes));
        dispatch(resetOrderState());
        if (restaurantType === RestaurantType.RESTAURANT) {
            setBottomSheetOpen(true);
        } else {
            navigate(RootLinks.REVIEWFOODCOURTORDER);
        }
    };

    const handleOrder = () => {
        navigate(RootLinks.OTPVERIFICATION, { state: { existingOrder: false } });
    }

    const handleCloseBottomSheet = () => {
        dispatch(resetCustomerState());
        setBottomSheetOpen(false);
    };

    const handleCreateOrder = (value?: CustomerOTPRequest) => {
        setPhoneNumber(value?.phoneNumber ?? "");
        setCustomerName(value?.name ?? "");
        setBottomSheetOpen(false);
        handleOrder();
    };

    const handleVehicleConfirm = (details: { vehicleModel: string; vehicleNumber: string }) => {
        setVehicleDetail(details);
        setBottomSheetStep('user');
    };

    const subTotalValue = useMemo(() => {
        return restaurantType === RestaurantType.RESTAURANT
            ? cartItems.reduce((total, item) => total + Number(item.total), 0)
            : (Number(cartResponse?.totalAmount) ?? 0);
    }, [cartItems, cartResponse, restaurantType]);

    const serviceChargeValue = serviceCharge?.type === 'fixed' ? serviceCharge.value : (Number(serviceCharge?.value) / 100) * subTotalValue;

    const totalPaymentValue = useMemo(() => {
        return restaurantType === RestaurantType.RESTAURANT
            ? cartItems.reduce((total, item) => total + Number(item.total), 0) + Number(serviceChargeValue)
            : (Number(cartResponse?.totalAmount) ?? 0) + Number(serviceChargeValue);
    }, [cartItems, cartResponse, restaurantType, serviceChargeValue]);

    // Empty cart state
    if (validateCartItems.length === 0) {
        return (
            <div className="min-h-screen  bg-linear-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag className="w-10 h-10 text-orange-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
                    <p className="text-gray-600 mb-6">Add some delicious items to get started!</p>
                    <Button
                        onClick={() => navigate(-1)}
                        className="px-6 py-3"
                    >
                        Browse Menu
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col">
            <div className="w-full">

                <Header title="Review Your Order" />

                <div className="p-4 pb-24 space-y-4 mt-16 flex flex-col flex-1">
                    <div className="space-y-4">
                        {validateCartItems.flatMap((item, index) => (
                            <ReviewOrderItem
                                key={index}
                                item={item}
                                onAddClick={() => handleQuantityChange(index, 1)}
                                onMinClick={() => handleQuantityChange(index, -1)}
                                onDeleteClick={() => handleDeleteItem(index)}
                            />
                        ))}
                    </div>

                    <hr className="my-4 border-gray-100" />

                    {/* Add Order Notes */}
                    <div className="mb-24">
                        <h2 className="text-base font-semibold text-gray-700 mb-2">
                            Add Order Notes (Optional)
                        </h2>
                        <textarea
                            value={orderNotes}
                            onChange={(e) => setOrderNotes(e.target.value)}
                            rows={4}
                            placeholder="e.g. allergy information, special request"
                            className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-400 focus:border-transparent text-sm resize-none transition-all"
                        />
                    </div>

                    <hr className="my-4 border-gray-100" />
                </div>

                {/* Sticky Footer (Fixed at the bottom) */}
                <footer className={`fixed ${restaurantType === RestaurantType.RESTAURANT ? 'bottom-0' : 'bottom-20'} w-full p-4 bg-white/95 backdrop-blur-md border-t border-orange-100 shadow-2xl rounded-t-2xl`}>
                    {/* Payment Breakdown */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-base">
                            <span className="text-gray-600">Sub Total</span>
                            <span className="font-semibold text-gray-800">
                                {formatPrice(subTotalValue)}
                            </span>
                        </div>
                        <div className="flex justify-between text-base">
                            <span className="text-gray-600">Service Charge</span>
                            <span className="font-semibold text-gray-800">
                                {serviceChargeValue}
                            </span>
                        </div>
                        <div className="flex justify-between text-lg py-2 font-bold border-t border-gray-200 mt-2">
                            <span className="text-gray-900">Total Payment</span>
                            <span className="bg-linear-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                                {formatPrice(totalPaymentValue)}
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-between items-center space-x-4">
                        <Button
                            size="lg"
                            onClick={handleConfirm}
                            className="grow bg-linear-to-r text-white font-medium py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
                        >
                            Confirm Order
                        </Button>
                    </div>
                </footer>
            </div>

            <BottomSheet isOpen={isBottomSheetOpen} onClose={handleCloseBottomSheet}>
                {bottomSheetStep === 'vehicle' && orderType === OrderType.PARKING ? (
                    <EnterVehicleDetailSection onConfirm={handleVehicleConfirm} />
                ) : (
                    <EnterUserDetailSection onConfirm={handleCreateOrder} />
                )}
            </BottomSheet>

        </div>
    );
};

export default ReviewOrder;