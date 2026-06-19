import axiosClient from "../../api/axiosClient";
import { CreateMenuItemRequest, FetchAllMenuItemResponse, FetchMenuItemLessWeightResponse, FetchMenuItemRequest, MenuItem, UploadMenuItemImageResponse } from "./types";

const MenuItemAPI = {
    fetchMenuItem: ({ restaurantId, page, limit, search, categoryId }: FetchMenuItemRequest) => axiosClient.get<FetchAllMenuItemResponse>(`/api/menus/restaurant/${restaurantId}`, { params: { page, limit, search, categoryId } }),
    createMenuItem: (args: CreateMenuItemRequest) => {
        const { isFeatured, featuredOrder, badges, ...rest } = args;
        const variantOptions = rest.variantOptions?.map(i => ({ ...i, options: i.options?.map(({ id, isDefault, ...rest }) => rest) }));
        return axiosClient.post<MenuItem>('/api/menus', { ...rest, variantOptions })
    },
    updateMenuItem: (args: CreateMenuItemRequest) => {
        const { id, isFeatured, featuredOrder, badges, ...rest } = args;
        const variantOptions = rest.variantOptions?.map(i => ({ ...i, options: i.options?.map(({ id, isDefault, ...rest }) => rest) }));
        return axiosClient.patch(`/api/menus/${id}`, { ...rest, variantOptions })
    },
    deleteMenuItem: (menuId: string) => axiosClient.delete(`/api/menus/${menuId}`),
    updateAvailabity: ({ menuId, restaurantId, value }: { menuId: string, restaurantId: string, value: boolean }) => axiosClient.patch<MenuItem>(`/api/menus/${menuId}/availability?restaurantId=${restaurantId}`, { isAvailable: value }),
    uploadImage: (restaurantId: string, file: File) => {
        const formData = new FormData();
        formData.append('restaurantId', restaurantId);
        formData.append('image', file);
        return axiosClient.post<UploadMenuItemImageResponse>('/api/upload/menu', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    fetchMenuItemLessWeight: ({ restaurantId, search }: FetchMenuItemRequest) => axiosClient.get<FetchMenuItemLessWeightResponse[]>(`/api/menus/search/lightweight`, { params: { restaurantId, search } }),
    fetchBadges: () => axiosClient.get<string[]>(`/api/badges`),
    attachBadges: (args: { menuId: string, isFeatured: boolean, featuredOrder: number, badges: string[] }) => axiosClient.patch<MenuItem>(`/api/menus/${args.menuId}/featured`, { isFeatured: args.isFeatured, featuredOrder: args.featuredOrder, badges: args.badges }),
    fetchTopSellingItems: ({ restaurantId }: FetchMenuItemRequest) => axiosClient.get<MenuItem[]>(`/api/menus/top-selling/${restaurantId}`),
    fetchTopFeaturedItems: ({ restaurantId }: FetchMenuItemRequest) => axiosClient.get<MenuItem[]>(`/api/menus/featured/${restaurantId}`),
}

export default MenuItemAPI;