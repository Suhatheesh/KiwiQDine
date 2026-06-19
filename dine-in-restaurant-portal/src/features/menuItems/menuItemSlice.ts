import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Badge, CreateMenuItemRequest, FetchAllMenuItemResponse, FetchMenuItemLessWeightResponse, FetchMenuItemRequest, InitialMenuItemyType, MenuItem, UploadMenuItemImageResponse } from "./types";

const initalState: InitialMenuItemyType = {
    isCreateMenuItem: false,
    isUpdateMenuItem: false,
    isDeleteMenuItem: false,
    data: [],
    loading: false,
    error: null,
    total: 0,
    page: "1",
    limit: "10",
    totalPages: 0,
    image: null,
    imageLoading: false,
    isPaginationFetching: false,
    menuItemsLessWeight: [],
    badges: []
}

const menuItemSlice = createSlice({
    name: '/menuItemSlice',
    initialState: initalState,
    reducers: {
        pagination: (state, action: PayloadAction<string>) => {
            state.page = action.payload;
        },
        resetPagination: (state) => {
            state.page = "1";
            state.limit = "10";
        },

        resetMenuItem: (state) => {
            state.image = null;
        },

        /** Fetch Menu Item **/
        fetchMenuItemRequest: (state, action: PayloadAction<FetchMenuItemRequest | undefined>) => {
            state.loading = action.payload?.page === "1";
            state.isPaginationFetching = action.payload?.page !== "1";
            state.isCreateMenuItem = false;
            state.isUpdateMenuItem = false;
            state.isDeleteMenuItem = false;
            state.error = null;
        },
        fetchMenuItemSuccess: (state, action: PayloadAction<FetchAllMenuItemResponse>) => {
            const { limit, total, totalPages, data, page } = action.payload
            state.loading = false;
            state.data = Number(page) === 1 ? data : [
                ...state.data,
                ...data.filter(
                    d => !state.data.some(s => s.id === d.id)
                ),
            ];
            state.limit = limit;
            state.total = total
            state.totalPages = totalPages
            state.isPaginationFetching = false;
        },
        fetchMenuItemFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isPaginationFetching = false;
            state.error = action.payload;
        },

        fetchMenuItemLessWeightRequest: (state, action: PayloadAction<FetchMenuItemRequest | undefined>) => {
            state.isPaginationFetching = action.payload?.page !== "1";
            state.isCreateMenuItem = false;
            state.isUpdateMenuItem = false;
            state.isDeleteMenuItem = false;
            state.error = null;
        },
        fetchMenuItemLessWeightSuccess: (state, action: PayloadAction<FetchMenuItemLessWeightResponse[]>) => {
            state.menuItemsLessWeight = action.payload
            state.isPaginationFetching = false;
        },
        fetchMenuItemLessWeightFaliure: (state, action: PayloadAction<string>) => {
            state.isPaginationFetching = false;
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
        deleteMenuItemRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.isCreateMenuItem = false;
            state.isUpdateMenuItem = false;
            state.isDeleteMenuItem = false;
            state.error = null;
        },
        deleteMenuItemSuccess: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isDeleteMenuItem = true;
            state.data = state.data.filter((i) => i.id && !action.payload.includes(i.id));
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
            state.imageLoading = true;
            state.error = null;
        },
        uploadMenuItemImageSuccess: (state, action: PayloadAction<UploadMenuItemImageResponse>) => {
            state.imageLoading = false;
            state.image = action.payload;
        },
        uploadMenuItemImageFaliure: (state, action: PayloadAction<string>) => {
            state.imageLoading = false;
            state.error = action.payload;
        },

        /** Fetch Badges **/
        fetchBadgesRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.isCreateMenuItem = false;
            state.isUpdateMenuItem = false;
            state.isDeleteMenuItem = false;
            state.error = null;
        },
        fetchBadgesSuccess: (state, action: PayloadAction<Badge[]>) => {
            state.loading = false;
            state.badges = action.payload;
        },
        fetchBadgesFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        /** Attach Badges **/
        attachBadgesRequest: (state, _: PayloadAction<{ menuId: string, isFeatured: boolean, featuredOrder: number, badges: string[] }>) => {
            state.loading = true;
            state.isCreateMenuItem = false;
            state.isUpdateMenuItem = false;
            state.isDeleteMenuItem = false;
            state.error = null;
        },
        attachBadgesSuccess: (state, action: PayloadAction<MenuItem>) => {
            state.loading = false;
            state.isUpdateMenuItem = true;
            state.data = state.data.map(
                (i) => i.id === action.payload.id ? { ...i, badges: [...action.payload.badges ?? []] } : i);
        },
        attachBadgesFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        /** Fetch Top Selling Items **/
        fetchTopSellingItemsRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.isCreateMenuItem = false;
            state.isUpdateMenuItem = false;
            state.isDeleteMenuItem = false;
            state.error = null;
        },
        fetchTopSellingItemsSuccess: (state, action: PayloadAction<MenuItem[]>) => {
            state.loading = false;
            state.data = action.payload;
        },
        fetchTopSellingItemsFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        /** Fetch Top Featured Items **/
        fetchTopFeaturedItemsRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.isCreateMenuItem = false;
            state.isUpdateMenuItem = false;
            state.isDeleteMenuItem = false;
            state.error = null;
        },
        fetchTopFeaturedItemsSuccess: (state, action: PayloadAction<MenuItem[]>) => {
            state.loading = false;
            state.data = action.payload;
        },
        fetchTopFeaturedItemsFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },
    }
})

export const {
    pagination,
    resetPagination,

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
    uploadMenuItemImageFaliure,

    fetchBadgesRequest,
    fetchBadgesSuccess,
    fetchBadgesFaliure,

    attachBadgesRequest,
    attachBadgesSuccess,
    attachBadgesFaliure,

    fetchTopSellingItemsRequest,
    fetchTopSellingItemsSuccess,
    fetchTopSellingItemsFaliure,

    fetchTopFeaturedItemsRequest,
    fetchTopFeaturedItemsSuccess,
    fetchTopFeaturedItemsFaliure,

    resetMenuItem

} = menuItemSlice.actions;

export default menuItemSlice.reducer;