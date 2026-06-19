import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Category, CategoryRequest, InitialCategoryType } from "./types";
import { UploadMenuItemImageResponse } from "../menuItems/types";

const initialState: InitialCategoryType = {
    isCreateCategory: false,
    isDeleteCategory: false,
    categoies: [],
    loading: false,
    error: null,
    image: null,
    isUpdateCategory: false
}

const categorySlice = createSlice({
    name: '/categorySlice',
    initialState: initialState,
    reducers: {
        fetchAllCategoryRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.error = null;
        },
        fetchAllCategorySuccess: (state, action: PayloadAction<Category[]>) => {
            state.loading = false;
            state.categoies = action.payload;
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
            state.categoies = [...state.categoies, action.payload];
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
            state.categoies = state.categoies.map(i => i.id === action.payload.id ? action.payload : i);
        },
        updateCategoryFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
            state.isUpdateCategory = false;
        },

        deleteCategoryRequest: (state, _: PayloadAction<{ ids: string[], restaurantId: string }>) => {
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
        },
        uploadCategoryImageSuccess: (state, action: PayloadAction<UploadMenuItemImageResponse>) => {
            state.image = action.payload;
            state.error = null;
        },
        uploadCategoryImageFaliure: (state, action: PayloadAction<string>) => {
            state.error = action.payload;
        }
    }
});

export const {
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
    uploadCategoryImageFaliure
} = categorySlice.actions;
export default categorySlice.reducer;