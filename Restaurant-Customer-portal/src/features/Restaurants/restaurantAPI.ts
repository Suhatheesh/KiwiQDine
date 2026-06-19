import axiosClient from "../../api/axiosClient";

const RestaurantAPI = {
    fetchRestaurants: (restaurantId?: string, tenantId?: string) =>
        axiosClient.get('/api/menus/tenant', {
            params: { restaurantId, tenantId }
        })
};

export default RestaurantAPI;