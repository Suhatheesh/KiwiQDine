import axiosClient from "../../api/axiosClient";
import { UploadMenuItemImageResponse } from "../menuItems/types";
import { CategoryRequest, CategoryResponse, ReorderCategoriesRequest } from "./types";

const CategoryAPI = {
    fetchAllCategory: () => axiosClient.get<CategoryResponse>('/api/categories'),
    createCategory: (args: CategoryRequest) => axiosClient.post<CategoryResponse>('/api/categories', args),
    updateCategory: (args: CategoryRequest) => {
        const { id, restaurantId, ...rest } = args;
        return axiosClient.patch<CategoryResponse>(`/api/categories/${id}`, rest)
    },
    deleteCategory: (args: string[]) => axiosClient.delete<CategoryResponse>('/api/categories', { data: { ids: args } }),
    uploadImage: (restaurantId: string, file: File) => {
        const formData = new FormData();
        formData.append('restaurantId', restaurantId);
        formData.append('image', file);
        return axiosClient.post<UploadMenuItemImageResponse>('/api/upload/category', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    reorderCategories: (args: { restaurantId: string, categories: ReorderCategoriesRequest }) => axiosClient.patch<CategoryResponse>(`/api/categories/reorder`, { restaurantId: args.restaurantId, orders: args.categories })
}

export default CategoryAPI;