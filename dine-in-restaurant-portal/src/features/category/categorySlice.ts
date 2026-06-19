import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Category, CategoryRequest, InitialCategoryType, ReorderCategoriesRequest } from "./types";
import { UploadMenuItemImageResponse } from "../menuItems/types";

const initialState: InitialCategoryType = {
    isCreateCategory: false,
    isUpdateCategory: false,
    isDeleteCategory: false,
    categoies: [],
    loading: false,
    error: null,
    image: null,
    imageLoading: false
}

const categorySlice = createSlice({
    name: '/categorySlice',
    initialState: initialState,
    reducers: {
        resetImage: (state) => {
            state.image = null;
            state.imageLoading = false;
        },

        fetchAllCategoryRequest: (state) => {
            state.loading = true;
            state.error = null;
        },
        fetchAllCategorySuccess: (state, action: PayloadAction<Category[]>) => {
            state.loading = false;
            state.categoies = [...action.payload].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        },
        fetchAllCategoryFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        createCategoryRequest: (state, _: PayloadAction<CategoryRequest>) => {
            state.loading = true;
            state.isCreateCategory = false;
            state.isDeleteCategory = false;
            state.error = null
        },
        createCategorySuccess: (state, action: PayloadAction<Category>) => {
            state.loading = false;
            state.isCreateCategory = true;
            state.categoies = [...state.categoies, action.payload].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        },
        createCategoryFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
            state.isCreateCategory = false;
        },

        updateCategoryRequest: (state, _: PayloadAction<CategoryRequest>) => {
            state.loading = true;
            state.isUpdateCategory = false;
            state.error = null
        },
        updateCategorySuccess: (state, action: PayloadAction<Category>) => {
            state.loading = false;
            state.isUpdateCategory = true;
            state.categoies = state.categoies.map(i => i.id === action.payload.id ? action.payload : i).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
        },
        updateCategoryFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
            state.isUpdateCategory = false;
        },

        deleteCategoryRequest: (state, _: PayloadAction<string[]>) => {
            state.loading = true;
            state.isCreateCategory = false;
            state.isDeleteCategory = false;
            state.error = null
        },
        deleteCategorySuccess: (state, action: PayloadAction<string[]>) => {
            state.loading = false;
            state.isDeleteCategory = true;
            state.categoies = state.categoies.filter(i => !action.payload.includes(i.id));
        },
        deleteCategoryFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
            state.isDeleteCategory = false;
        },

        uploadCategoryImageRequest: (state, _: PayloadAction<{ restaurantId: string, image: string }>) => {
            state.error = null;
            state.imageLoading = true;
        },
        uploadCategoryImageSuccess: (state, action: PayloadAction<UploadMenuItemImageResponse>) => {
            state.image = action.payload;
            state.error = null;
            state.imageLoading = false;
        },
        uploadCategoryImageFaliure: (state, action: PayloadAction<string>) => {
            state.error = action.payload;
            state.imageLoading = false;
        },

        reorderCategoriesRequest: (state, _: PayloadAction<{ restaurantId: string, categories: ReorderCategoriesRequest }>) => {
            state.loading = true;
            state.error = null;
        },
        reorderCategoriesSuccess: (state, _: PayloadAction<boolean>) => {
            state.loading = false;
        },
        reorderCategoriesFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },
    }
});

export const {
    resetImage,

    fetchAllCategoryRequest,
    fetchAllCategorySuccess,
    fetchAllCategoryFaliure,

    createCategoryRequest,
    createCategorySuccess,
    createCategoryFaliure,

    updateCategoryRequest,
    updateCategorySuccess,
    updateCategoryFaliure,

    deleteCategoryRequest,
    deleteCategorySuccess,
    deleteCategoryFaliure,

    uploadCategoryImageRequest,
    uploadCategoryImageSuccess,
    uploadCategoryImageFaliure,

    reorderCategoriesRequest,
    reorderCategoriesSuccess,
    reorderCategoriesFaliure

} = categorySlice.actions;
export default categorySlice.reducer;