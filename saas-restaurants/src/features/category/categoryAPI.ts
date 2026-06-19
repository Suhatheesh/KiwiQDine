import axiosClient from "../../api/axiosClient";
import { UploadMenuItemImageResponse } from "../menuItems/types";
import { CategoryRequest, CategoryResponse } from "./types";

const CategoryAPI = {
    fetchAllCategory: (restaurantId: string) => axiosClient.get<CategoryResponse>(`/api/categories`, { params: { restaurantId } }),
    createCategory: (args: CategoryRequest) => axiosClient.post<CategoryResponse>('/api/categories', args),
    deleteCategory: (args: string[], restaurantId: string) => axiosClient.delete<CategoryResponse>('/api/categories', { data: { ids: args, restaurantId } }),
    uploadImage: (restaurantId: string, file: File) => {
        const formData = new FormData();
        formData.append('restaurantId', restaurantId);
        formData.append('image', file);
        return axiosClient.post<UploadMenuItemImageResponse>('/api/upload/category', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    updateCategory: (args: CategoryRequest) => {
        const { id, restaurantId, ...rest } = args;
        return axiosClient.patch<CategoryResponse>(`/api/categories/${id}`, rest, { params: { restaurantId } })
    },
}

export default CategoryAPI;