import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { InitialMenuType, MenuAPIResponse, MenuCategory, MenuFilter, MenuItem } from "./types";

const initialState: InitialMenuType = {
    loading: true,
    error: null,
    items: [],
    pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0
    },
    isPaginationLoading: false
};

const menuSlice = createSlice({
    name: 'menu',
    initialState,
    reducers: {
        pagination: (state, action: PayloadAction<number>) => {
            state.pagination.page = action.payload;
        },

        fetchMenuRequest: (state, action: PayloadAction<{ restaurantId: string, filter: MenuFilter }>) => {
            state.loading = action.payload.filter.page === 1;
            state.isPaginationLoading = action.payload.filter.page ? action.payload.filter.page > 1 : false;
            state.error = null;
        },
        fetchMenuSuccess: (state, action: PayloadAction<MenuAPIResponse>) => {
            state.loading = false;
            state.isPaginationLoading = false;
            const newItems = action.payload.items || [];
            if (action.payload.pagination.page > 1) {
                state.items = [...(state.items || []), ...newItems];
            } else {
                state.items = newItems;
            }
            state.pagination = action.payload.pagination;
        },
        fetchMenuFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        fetchCategoriesRequest: (state, _: PayloadAction<{ restaurantId: string }>) => {
            state.loading = true;
            state.error = null;
        },
        fetchCategoriesSuccess: (state, action: PayloadAction<MenuCategory[]>) => {
            state.loading = false;
            state.error = null;
            state.categories = action.payload.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
        },
        fetchCategoriesFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        fetchFeaturedMenuRequest: (state, _: PayloadAction<{ restaurantId: string }>) => {
            state.loading = true;
            state.error = null;
        },
        fetchFeaturedMenuSuccess: (state, action: PayloadAction<MenuItem[]>) => {
            state.loading = false;
            state.error = null;
            state.items = action.payload;
        },
        fetchFeaturedMenuFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        fetchTopSellingItemsRequest: (state, _: PayloadAction<{ restaurantId: string }>) => {
            state.loading = true;
            state.error = null;
        },
        fetchTopSellingItemsSuccess: (state, action: PayloadAction<MenuItem[]>) => {
            state.loading = false;
            state.error = null;
            state.items = action.payload;
        },
        fetchTopSellingItemsFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        clearMenu: (state) => {
            state.items = [];
            state.pagination = {
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0
            };
            state.error = null;
        }
    }
});

export const {
    pagination,
    fetchMenuRequest,
    fetchMenuSuccess,
    fetchMenuFailure,
    fetchCategoriesRequest,
    fetchCategoriesSuccess,
    fetchCategoriesFailure,
    fetchFeaturedMenuRequest,
    fetchFeaturedMenuSuccess,
    fetchFeaturedMenuFailure,
    fetchTopSellingItemsRequest,
    fetchTopSellingItemsSuccess,
    fetchTopSellingItemsFailure,
    clearMenu
} = menuSlice.actions;

export default menuSlice.reducer;