import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { InitialAnalyticsState, AnalyticsFilters } from "./types";

const initialState: InitialAnalyticsState = {
    analyticsData: null,
    loading: false,
    error: null,
    orderAnalyticsData: null
}

const analyticsSlice = createSlice({
    name: "analytics",
    initialState,
    reducers: {
        fetchAnalyticsDataRequest: (state, _: PayloadAction<AnalyticsFilters | undefined>) => {
            state.loading = true;
        },
        fetchAnalyticsDataSuccess: (state, action) => {
            state.loading = false;
            state.analyticsData = action.payload;
        },
        fetchAnalyticsDataFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },

        fetchOrderAnalyticsDataRequest: (state, _: PayloadAction<{ restaurantId: string, filters?: AnalyticsFilters }>) => {
            state.loading = true;
        },
        fetchOrderAnalyticsDataSuccess: (state, action) => {
            state.loading = false;
            state.orderAnalyticsData = action.payload;
        },
        fetchOrderAnalyticsDataFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },

        fetchKotAnalyticsDataRequest: (state, _: PayloadAction<{ restaurantId: string, filters?: AnalyticsFilters }>) => {
            state.loading = true;
        },
        fetchKotAnalyticsDataSuccess: (state, action) => {
            state.loading = false;
            state.orderAnalyticsData = action.payload;
        },
        fetchKotAnalyticsDataFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
    },
});

export const {
    fetchAnalyticsDataRequest,
    fetchAnalyticsDataSuccess,
    fetchAnalyticsDataFailure,
    fetchOrderAnalyticsDataRequest,
    fetchOrderAnalyticsDataSuccess,
    fetchOrderAnalyticsDataFailure,
    fetchKotAnalyticsDataRequest,
    fetchKotAnalyticsDataSuccess,
    fetchKotAnalyticsDataFailure
} = analyticsSlice.actions;
export default analyticsSlice.reducer
