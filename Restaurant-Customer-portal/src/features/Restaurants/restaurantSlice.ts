import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { InitialRestaurantState, RestaurantListResponse } from "./types";

const initialState: InitialRestaurantState = {
    restaurants: [],
    error: null,
    loading: false
}

const restaurantSlice = createSlice({
    name: "restaurant",
    initialState: initialState,
    reducers: {
        fetchRestaurantsRequest: (state, _: PayloadAction<{ restaurantId?: string, tenantId?: string, type: string }>) => {
            state.restaurants = [];
            state.error = null;
            state.loading = true;
        },
        fetchRestaurantsSuccess: (state, action: PayloadAction<RestaurantListResponse>) => {
            state.restaurants = action.payload;
            state.error = null;
            state.loading = false;
        },
        fetchRestaurantsFailure: (state, action: PayloadAction<string>) => {
            state.restaurants = [];
            state.error = action.payload;
            state.loading = false;
        }
    },
});

export const { fetchRestaurantsRequest, fetchRestaurantsSuccess, fetchRestaurantsFailure } = restaurantSlice.actions;
export default restaurantSlice.reducer;
