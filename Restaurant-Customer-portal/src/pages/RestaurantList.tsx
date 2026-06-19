import { FC, useLayoutEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../app/store";
import { fetchRestaurantsRequest } from "../features/Restaurants/restaurantSlice";
import { Store } from "lucide-react";
import Header from "../components/Header";
import { RootLinks } from "../routers/types";
import useRestaurant from "../hooks/useRestaurant";
import RestaurantCard from "../components/RestaurantCard";

const RestaurantList: FC = () => {
    const { restaurantType, tenantId, setRestaurantIdv2, onServiceCharge } = useRestaurant();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const { restaurants, loading } = useSelector((state: RootState) => state.restaurant);

    useLayoutEffect(() => {
        if (!tenantId) return;
        dispatch(fetchRestaurantsRequest({ type: restaurantType, tenantId }));
    }, [dispatch, restaurantType, tenantId]);

    const handleRestaurantClick = (restaurantId: string) => {
        const restaurant = restaurants.find((restaurant) => restaurant.restaurant.id === restaurantId);
        setRestaurantIdv2(restaurantId);
        onServiceCharge({ type: restaurant?.restaurant?.serviceChargeType ?? "", value: restaurant?.restaurant.serviceChargeType === 'fixed' ? Number(restaurant?.restaurant.fixedServiceCharge) : Number(restaurant?.restaurant.serviceChargePercentage) });
        navigate(RootLinks.MENU, { state: { logo: restaurant?.restaurant?.logo, title: restaurant?.restaurant?.name } });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header title="Choose Restaurant" showBackButton={false} />

                <div className="p-4 sm:p-6 md:p-8 mt-16 max-w-6xl mx-auto">
                    {/* Header Section */}
                    <div className="text-center mb-8">
                        <div className="h-9 bg-gray-200 rounded-lg w-72 mx-auto mb-2 animate-pulse"></div>
                        <div className="h-6 bg-gray-200 rounded-lg w-48 mx-auto animate-pulse"></div>
                    </div>

                    {/* Skeleton Cards */}
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5, 6].map((index) => (
                            <div key={index} className="bg-white rounded-2xl border border-gray-200 p-4 animate-pulse">
                                <div className="flex items-center gap-4">
                                    {/* Image Skeleton */}
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-xl shrink-0"></div>

                                    {/* Name Skeleton */}
                                    <div className="flex-1">
                                        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                                    </div>

                                    {/* Chevron Skeleton */}
                                    <div className="w-6 h-6 bg-gray-200 rounded shrink-0"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 overflow-scroll">
            <Header title="Choose Restaurant" showBackButton={false} />

            <div className="p-4 sm:p-6 md:p-8 mt-16 max-w-2xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
                        Select Your Restaurant
                    </h1>
                    <p className="text-gray-500 font-medium">
                        Choose from our available locations
                    </p>
                </div>

                {/* Restaurant List */}
                {restaurants.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Store className="w-10 h-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            No Restaurants Available
                        </h3>
                        <p className="text-gray-500">
                            Please check back later
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {restaurants.map((restaurant) => (
                            <RestaurantCard
                                key={restaurant.restaurant.id}
                                data={restaurant}
                                onClick={handleRestaurantClick}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default RestaurantList;