import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DashboardAnalyticsResponse, InitialRestaurantAnalyticsState, PeriodType, RestaurantAnalyticsResponse } from "./types";

const initialState: InitialRestaurantAnalyticsState = {
    salesOverview: [],
    orderByCategory: [],
    paymentOverview: [],
    loading: false,
    error: null,
    restaurantAnalytics: null,
    dashboardAnalytics: null,
}

const analyticsSlice = createSlice({
    name: 'analytics',
    initialState,
    reducers: {
        fetchSummaryDataRequest: (state, _: PayloadAction<{ period: PeriodType, restaurantId: string }>) => {
            state.loading = true;
            state.error = null;
        },
        fetchSummaryDataSuccess: (state, action: PayloadAction<RestaurantAnalyticsResponse>) => {
            state.salesOverview = action.payload.salesOverview;
            state.orderByCategory = action.payload.orderByCategory;
            state.paymentOverview = action.payload.paymentOverview;
            state.restaurantAnalytics = action.payload.restaurantAnalytics;
            state.loading = false;
            state.error = null;
        },
        fetchSummaryDataFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        fetchDashboardAnalyticsRequest: (state, _: PayloadAction<{ period: PeriodType }>) => {
            state.loading = true;
            state.error = null;
        },
        fetchDashboardAnalyticsSuccess: (state, action: PayloadAction<DashboardAnalyticsResponse>) => {
            state.dashboardAnalytics = action.payload;
            state.loading = false;
            state.error = null;
        },
        fetchDashboardAnalyticsFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },
    },
});

export const {
    fetchSummaryDataRequest,
    fetchSummaryDataSuccess,
    fetchSummaryDataFailure,

    fetchDashboardAnalyticsRequest,
    fetchDashboardAnalyticsSuccess,
    fetchDashboardAnalyticsFailure,
} = analyticsSlice.actions;

export default analyticsSlice.reducer;