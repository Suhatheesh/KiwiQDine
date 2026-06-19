import { useContext } from "react";
import { RestaurantContext } from "../context/RestaurantContext";

const useRestaurant = () => {
    const context = useContext(RestaurantContext);
    if (!context) {
        throw new Error("useRestaurant must be used within a RestaurantContextProvider");
    }
    return context;
};

export default useRestaurant;
