import axiosClient from "../../api/axiosClient";
import { MenuAPIResponse, MenuFilter } from "./types";

const MenuAPI = {
    fetchMenu: async (qrCodeId: string): Promise<MenuAPIResponse> => {
        return axiosClient.get<any, MenuAPIResponse>(
            `/api/customer-portal/qr/${qrCodeId}/menu`
        );
    },
    fetchFilteredMenu: async (restaurantId: string, filter: MenuFilter): Promise<MenuAPIResponse> => {
        return axiosClient.get<any, MenuAPIResponse>(
            `/api/menus/filter/${restaurantId}`,
            { params: filter }
        );
    },
    fetchCategories: async (restaurantId: string): Promise<MenuAPIResponse> => {
        return axiosClient.get<any, MenuAPIResponse>(
            `/api/customer-portal/restaurant/${restaurantId}/categories`
        );
    },
    fetchFeaturedMenu: async (restaurantId: string): Promise<MenuAPIResponse> => {
        return axiosClient.get<any, MenuAPIResponse>(
            `/api/menus/featured/${restaurantId}`
        );
    },
    fetchTopSellingItems: (restaurantId: string) => axiosClient.get<MenuAPIResponse>(`/api/menus/top-selling/${restaurantId}`),
};

export { MenuAPI };