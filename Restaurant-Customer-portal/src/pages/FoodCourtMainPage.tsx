import { Outlet } from "react-router-dom";
import BottomNavigation from "../components/BottomNavigation";
import { RestaurantType } from "../utils/Constant";
import useRestaurant from "../hooks/useRestaurant";

const FoodCourtMainLayout = () => {
    const { restaurantType } = useRestaurant();
    return (
        <div>
            <main>
                <div className={`flex flex-1 flex-col ${restaurantType === RestaurantType.FOOD_COURT ? 'pb-20' : 'pb-0'}`}>
                    <Outlet />
                </div>
            </main>
            {restaurantType === RestaurantType.FOOD_COURT && <BottomNavigation />}
        </div>
    );
};

export default FoodCourtMainLayout;