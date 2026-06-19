import axiosClient from "../../api/axiosClient";
import { CreateMenuItemRequest, FetchAllMenuItemRequest, FetchAllMenuItemResponse, FetchMenuItemLessWeightResponse, FetchMenuItemRequest, MenuItem, UploadMenuItemImageResponse } from "./types";

const MenuItemAPI = {
    fetchMenuItem: (args: FetchAllMenuItemRequest) => {
        const { restaurantId, ...rest } = args;
        return axiosClient.get<FetchAllMenuItemResponse>(`/api/menus/restaurant/${restaurantId}`, { params: rest })
    },
    createMenuItem: (args: CreateMenuItemRequest) => {
        const variantOptions = args.variantOptions?.map(i => ({ ...i, options: i.options?.map(({ id, isDefault, ...rest }) => rest) }));
        return axiosClient.post<MenuItem>('/api/menus', { ...args, variantOptions })
    },
    updateMenuItem: (args: CreateMenuItemRequest) => {
        const { id, ...rest } = args;
        const variantOptions = rest.variantOptions?.map(i => ({ ...i, options: i.options?.map(({ id, isDefault, ...rest }) => rest) }));
        return axiosClient.patch(`/api/menus/${id}`, { ...rest, variantOptions })
    },
    deleteMenuItem: (menuId: string, restaurantId: string) => axiosClient.delete(`/api/menus/${menuId}`, { params: { restaurantId } }),
    updateAvailabity: ({ menuId, restaurantId, value }: { menuId: string, restaurantId: string, value: boolean }) => axiosClient.patch<MenuItem>(`/api/menus/${menuId}/availability?restaurantId=${restaurantId}`, { isAvailable: value }),
    uploadImage: (restaurantId: string, file: File) => {
        const formData = new FormData();
        formData.append('restaurantId', restaurantId);
        formData.append('image', file);
        return axiosClient.post<UploadMenuItemImageResponse>('/api/upload/menu', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    fetchMenuItemLessWeight: ({ restaurantId, search }: FetchMenuItemRequest) => axiosClient.get<FetchMenuItemLessWeightResponse[]>(`/api/menus/search/lightweight`, { params: { restaurantId, search } }),
}

export default MenuItemAPI;