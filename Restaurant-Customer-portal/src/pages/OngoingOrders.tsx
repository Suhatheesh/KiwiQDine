import React, { useLayoutEffect, useMemo, useState } from 'react';
import { Package, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { RootLinks } from '../routers/types';
import { Button } from '../components/Button';
import { useSelector } from 'react-redux';
import { RootState } from '../app/store';
import { fetchAllOrdersRequest, fetchAllRestaurantOrdersRequest } from '../features/Order/orderSlice';
import { useDispatch } from 'react-redux';
import useRestaurant from '../hooks/useRestaurant';
import { RestaurantType } from '../utils/Constant';
import { OrderSuccessResponse } from '../features/Order/types';
import FoodCourtOngoingOrderItem from '../components/FoodCourtOngoingOrderItem';
import RestaurantOngoingOrderItem from '../components/RestaurantOngoingOrderItem';
import SkeletonOrderCard from '../components/SkeletonOrderCard';
import { resetCustomerState } from '../features/Customer/customerSlice';
import BottomSheet from '../components/BottomSheet';
import EnterUserDetailSection from '../sections/EnterUserDetailSection';
import { CustomerOTPRequest } from '../features/Customer/types';

const OngoingOrders: React.FC = () => {

    const { phone, restaurantType, restaurantId, tenantId, setPhoneNumber } = useRestaurant();
    const navigate = useNavigate();

    const dispatch = useDispatch();

    const [isBottomSheetOpen, setBottomSheetOpen] = useState<boolean>(false);

    const { orders, restaurantOrders, loading } = useSelector((state: RootState) => state.order);
    const { customer } = useSelector((state: RootState) => state.customer);

    const accessToken = sessionStorage.getItem("accessToken");

    useLayoutEffect(() => {
        if (!phone) return;
        if (restaurantType === RestaurantType.RESTAURANT) {
            dispatch(fetchAllRestaurantOrdersRequest({ phone, restaurantId, activeOnly: true }));
        } else {
            dispatch(fetchAllOrdersRequest({ phone, tenantId }));
        }
    }, [phone, dispatch, restaurantType, restaurantId, tenantId])

    useLayoutEffect(() => {
        return () => { dispatch(resetCustomerState()); }
    }, [customer]);

    const activeRestaurantOrders = restaurantOrders;

    const activeFoodCourtOrders = useMemo(() => {
        return orders.map(restaurant => ({
            ...restaurant,
            orders: restaurant.orders.filter(order =>
                order.status === 'pending' ||
                order.status === 'preparing' ||
                order.status === 'ready' ||
                order.status === 'confirmed'
            )
        })).filter(restaurant => restaurant.orders.length > 0);
    }, [orders]);

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'pending':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'preparing':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'ready':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getStatusText = (status?: string): string => {
        switch (status) {
            case 'pending':
                return 'Pending';
            case 'preparing':
                return 'Preparing';
            case 'ready':
                return 'Ready';
            case 'confirmed':
                return 'Confirmed';
            case 'completed':
                return 'Completed';
            case 'served':
                return 'Served';
            default:
                return '';
        }
    };

    const handleOrderClick = (orderId?: string) => {
        navigate(`${RootLinks.ORDERSTATUS}/${orderId}`);
    };

    const handleNewOrder = () => {
        if (accessToken === null || accessToken.length === 0) {
            setBottomSheetOpen(true);
            return;
        }
        if (restaurantType === RestaurantType.RESTAURANT) {
            navigate(RootLinks.MENU, { state: { logo: "" } });
        } else {
            navigate(RootLinks.RESTAURANTLIST);
        }
    }

    const filteredOrders = (orders: OrderSuccessResponse[]) => {
        return orders.filter(order => order.status === 'pending' || order.status === 'preparing' || order.status === 'ready' || order.status === 'confirmed');
    }

    const handleCloseBottomSheet = () => {
        dispatch(resetCustomerState());
        setBottomSheetOpen(false);
    };

    const handleCreateOrder = (value?: CustomerOTPRequest) => {
        setPhoneNumber(value?.phoneNumber ?? "");
        setBottomSheetOpen(false);
        navigate(RootLinks.OTPVERIFICATION, { state: { existingOrder: true } });
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50/50">
            {/* Header */}
            <Header title="Your Orders" showBackButton={restaurantType === RestaurantType.RESTAURANT} />

            {/* Content */}
            <div className="flex flex-1 flex-col p-4 sm:p-6 mt-16 mx-auto w-full max-w-4xl mb-24 gap-6">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <SkeletonOrderCard key={i} />
                        ))}
                    </div>
                ) : (accessToken === null || accessToken.length === 0) ? (
                    <div className="flex flex-col items-center justify-center pt-20 px-4">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <Package className="w-12 h-12 text-gray-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">You need to login!</h2>
                        <p className="text-gray-500 mb-8 text-center max-w-xs">
                            Looks like you are not logged in. Please login to view your orders.
                        </p>
                        <Button
                            size="lg"
                            onClick={handleNewOrder}
                            className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-200"
                        >
                            Login
                        </Button>
                    </div>
                ) :
                    (orders.length === 0 && restaurantOrders.length === 0) ? (
                        <div className="flex flex-col items-center justify-center pt-20 px-4">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                <Package className="w-12 h-12 text-gray-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">You are new here!</h2>
                            <p className="text-gray-500 mb-8 text-center max-w-xs">
                                Looks like you don't have any orders in progress. Hungry?
                            </p>
                            <Button
                                size="lg"
                                onClick={handleNewOrder}
                                className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-200"
                            >
                                Browse Menu
                            </Button>
                        </div>
                    ) :
                        (activeFoodCourtOrders.length === 0 && activeRestaurantOrders.length === 0) ? (
                            // Empty State
                            <div className="flex flex-col items-center justify-center pt-20 px-4">
                                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                    <Package className="w-12 h-12 text-gray-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">No Active Orders</h2>
                                <p className="text-gray-500 mb-8 text-center max-w-xs">
                                    Looks like you don't have any orders in progress. Hungry?
                                </p>
                                <Button
                                    size="lg"
                                    onClick={handleNewOrder}
                                    className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-200"
                                >
                                    Browse Menu
                                </Button>
                            </div>
                        ) : (
                            <>
                                {restaurantType === RestaurantType.RESTAURANT ? activeRestaurantOrders.map((order) => {
                                    return (
                                        <RestaurantOngoingOrderItem
                                            key={order.id}
                                            order={order}
                                            handleOrderClick={handleOrderClick}
                                            getStatusColor={getStatusColor}
                                            getStatusText={getStatusText}
                                        />
                                    );
                                }) : orders.map((restaurant) => {
                                    const visibleOrders = filteredOrders(restaurant.orders);
                                    return (
                                        <FoodCourtOngoingOrderItem
                                            key={restaurant.restaurantId}
                                            restaurant={restaurant}
                                            visibleOrders={visibleOrders}
                                            handleOrderClick={handleOrderClick}
                                            getStatusColor={getStatusColor}
                                            getStatusText={getStatusText}
                                        />
                                    );
                                })}
                            </>
                        )}
            </div>

            {/* New Order Floating Button */}
            <div className="fixed bottom-6 left-0 right-0 flex justify-center px-6 z-20 pointer-events-none">
                <button
                    className="pointer-events-auto bg-gray-900 text-white flex items-center gap-3 px-6 py-3.5 rounded-full shadow-xl shadow-gray-200 hover:shadow-2xl hover:bg-black hover:scale-105 transition-all duration-300 active:scale-95"
                    onClick={handleNewOrder}
                >
                    <div className="bg-white/20 p-1 rounded-full">
                        <Plus className="w-5 h-5" />
                    </div>
                    <span className="font-semibold pr-1">Start New Order</span>
                </button>
            </div>
            {/* Bottom spacing for fixed button */}
            <div className="h-20" />

            <BottomSheet isOpen={isBottomSheetOpen} onClose={handleCloseBottomSheet}>
                <EnterUserDetailSection onConfirm={handleCreateOrder} />
            </BottomSheet>
        </div>
    );
};

export default OngoingOrders;
