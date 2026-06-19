import { FC } from "react";
import { MapPin, Phone, Clock } from "lucide-react";
import { RestaurantResponse } from "../features/Restaurants/types";
import restaurantPlaceholder from "../assets/restaurant_placeholder.png";

interface RestaurantCardProps {
    data: RestaurantResponse;
    onClick: (id: string) => void;
}

const RestaurantCard: FC<RestaurantCardProps> = ({ data, onClick }) => {
    const { restaurant } = data;

    return (
        <div
            onClick={() => onClick(restaurant.id)}
            className="group relative flex flex-col w-full bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100"
        >
            {/* Cover Image Section */}
            <div className="relative w-full h-40 sm:h-56 bg-gray-100">
                <div className="w-full h-full overflow-hidden relative rounded-t-xl">
                    <img
                        src={restaurant.banner || restaurantPlaceholder}
                        alt={restaurant.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                </div>

                {/* Free Shipping Badge */}
                <div className="absolute top-4 left-4 bg-[#22c55e] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-sm z-10">
                    {restaurant.isActive ? "Available" : "Not Available"}
                </div>

                {/* Overlapping Logo */}
                <div className="absolute -bottom-6 right-6 w-16 h-16 rounded-full border-4 border-white bg-black overflow-hidden shadow-lg z-10 flex items-center justify-center">
                    {restaurant.logo ? (
                        <img
                            src={restaurant.logo}
                            alt="Logo"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-white font-bold text-xs text-center leading-tight p-1">
                            {restaurant.name.substring(0, 2).toUpperCase()}
                        </span>
                    )}
                </div>
            </div>

            {/* Content Section */}
            <div className="pt-4 pb-5 px-5">
                <div className="flex flex-col gap-3">
                    {/* Restaurant Name */}
                    <h3 className="text-lg font-bold text-[#1a1c1e] leading-tight group-hover:text-orange-600 transition-colors">
                        {restaurant.name}
                    </h3>

                    {/* Metadata Row */}
                    <div className="flex items-center gap-6 text-sm font-semibold text-gray-700">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{restaurant.openTime} - {restaurant.closeTime}</span>
                        </div>
                    </div>

                    {/* Address & Contact */}
                    <div className="flex flex-col gap-1.5 border-t border-gray-50">
                        <div className="flex items-start gap-2 text-sm text-gray-500">
                            <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                            <span className="line-clamp-1">
                                {restaurant.address.lane}, {restaurant.address.city}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Phone className="w-4 h-4 shrink-0" />
                            <span>{restaurant.contactPhoneNumber}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RestaurantCard;
