import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CreateMenuItemRequest, FetchAllMenuItemRequest, FetchAllMenuItemResponse, FetchMenuItemLessWeightResponse, FetchMenuItemRequest, InitialMenuItemyType, MenuItem, UploadMenuItemImageResponse } from "./types";

const initalState: InitialMenuItemyType = {
    isCreateMenuItem: false,
    isUpdateMenuItem: false,
    isDeleteMenuItem: false,
    data: [],
    loading: false,
    error: null,
    total: 0,
    page: "",
    limit: "",
    totalPages: 0,
    image: null,
    imageLoading: false,
    menuItemsLessWeight: []
}

const menuItemSlice = createSlice({
    name: '/menuItemSlice',
    initialState: initalState,
    reducers: {

        /** Fetch Menu Item **/
        fetchMenuItemRequest: (state, _: PayloadAction<FetchAllMenuItemRequest>) => {
            state.loading = true;
            state.isCreateMenuItem = false;
            state.isUpdateMenuItem = false;
            state.isDeleteMenuItem = false;
            state.error = null;
        },
        fetchMenuItemSuccess: (state, action: PayloadAction<FetchAllMenuItemResponse>) => {
            const { limit, page, total, totalPages, data } = action.payload
            state.loading = false;
            state.data = data
            state.limit = limit;
            state.page = page
            state.total = total
            state.totalPages = totalPages
        },
        fetchMenuItemFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        fetchMenuItemLessWeightRequest: (state, _: PayloadAction<FetchMenuItemRequest | undefined>) => {
            state.isCreateMenuItem = false;
            state.isUpdateMenuItem = false;
            state.isDeleteMenuItem = false;
            state.error = null;
        },
        fetchMenuItemLessWeightSuccess: (state, action: PayloadAction<FetchMenuItemLessWeightResponse[]>) => {
            state.menuItemsLessWeight = action.payload
        },
        fetchMenuItemLessWeightFaliure: (state, action: PayloadAction<string>) => {
            state.error = action.payload;
        },

        /** Create Menu Item **/
        createMenuItemRequest: (state, _: PayloadAction<CreateMenuItemRequest>) => {
            state.loading = true;
            state.isCreateMenuItem = false;
            state.isUpdateMenuItem = false;
            state.isDeleteMenuItem = false;
            state.error = null;
        },
        createMenuItemSuccess: (state, action: PayloadAction<MenuItem>) => {
            state.loading = false;
            state.isCreateMenuItem = true;
            state.data = [action.payload, ...state.data];
        },
        createMenuItemFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isCreateMenuItem = false;
            state.error = action.payload;
        },

        /** Update Menu Item **/
        updateMenuItemRequest: (state, _: PayloadAction<CreateMenuItemRequest>) => {
            state.loading = true;
            state.isCreateMenuItem = false;
            state.isUpdateMenuItem = false;
            state.isDeleteMenuItem = false;
            state.error = null;
        },
        updateMenuItemSuccess: (state, action: PayloadAction<MenuItem>) => {
            state.loading = false;
            state.isUpdateMenuItem = true;
            state.data = state.data.map(
                (i) => i.id === action.payload.id ? action.payload : i);
        },
        updateMenuItemFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isUpdateMenuItem = false;
            state.error = action.payload;
        },

        /** Delete Menu Item **/
        deleteMenuItemRequest: (state, _: PayloadAction<{ menuId: string, restaurantId: string }>) => {
            state.loading = true;
            state.isCreateMenuItem = false;
            state.isUpdateMenuItem = false;
            state.isDeleteMenuItem = false;
            state.error = null;
        },
        deleteMenuItemSuccess: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isDeleteMenuItem = true;
            state.data = state.data.filter((i) => !action.payload.includes(i.id));
        },
        deleteMenuItemFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isDeleteMenuItem = false;
            state.error = action.payload;
        },

        /** Update Menu Item Availability **/
        menuItemAvailabilityRequest: (state, _: PayloadAction<{ menuId: string, restaurantId: string, value: boolean }>) => {
            state.loading = true;
            state.isCreateMenuItem = false;
            state.isUpdateMenuItem = false;
            state.isDeleteMenuItem = false;
            state.error = null;
        },
        menuItemAvailabilitySuccess: (state, action: PayloadAction<MenuItem>) => {
            state.loading = false;
            state.isUpdateMenuItem = true;
            state.data = state.data.map(
                (i) => i.id === action.payload.id ? action.payload : i);
        },
        menuItemAvailabilityFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        /** Upload Menu Item Image **/
        uploadMenuItemImageRequest: (state, _: PayloadAction<{ restaurantId: string, image: string }>) => {
            state.isCreateMenuItem = false;
            state.isUpdateMenuItem = false;
            state.isDeleteMenuItem = false;
            state.imageLoading = true;
            state.error = null;
        },
        uploadMenuItemImageSuccess: (state, action: PayloadAction<UploadMenuItemImageResponse>) => {
            state.image = action.payload;
            state.imageLoading = false;
        },
        uploadMenuItemImageFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },
    }
})

export const {
    fetchMenuItemRequest,
    fetchMenuItemSuccess,
    fetchMenuItemFaliure,

    fetchMenuItemLessWeightRequest,
    fetchMenuItemLessWeightSuccess,
    fetchMenuItemLessWeightFaliure,

    createMenuItemRequest,
    createMenuItemSuccess,
    createMenuItemFaliure,

    updateMenuItemRequest,
    updateMenuItemSuccess,
    updateMenuItemFaliure,

    deleteMenuItemRequest,
    deleteMenuItemSuccess,
    deleteMenuItemFaliure,

    menuItemAvailabilityRequest,
    menuItemAvailabilitySuccess,
    menuItemAvailabilityFaliure,

    uploadMenuItemImageRequest,
    uploadMenuItemImageSuccess,
    uploadMenuItemImageFaliure

} = menuItemSlice.actions;

export default menuItemSlice.reducer;