import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { DashboardResponse, InitialDashboardState, PeriodType } from "./types";

const initialState: InitialDashboardState = {
    summaryCards: null,
    salesOverview: [],
    orderByCategory: [],
    paymentOverview: [],
    tableOverview: [],
    recentOrders: [],
    topFoods: null,
    loading: false,
    error: null,
}

const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState,
    reducers: {
        fetchSummaryDataRequest: (state, _: PayloadAction<PeriodType | undefined>) => {
            state.loading = true;
            state.error = null;
        },
        fetchSummaryDataSuccess: (state, action: PayloadAction<DashboardResponse>) => {
            state.summaryCards = action.payload.summaryCards;
            state.salesOverview = action.payload.salesOverview;
            state.orderByCategory = action.payload.orderByCategory;
            state.paymentOverview = action.payload.paymentOverview;
            state.tableOverview = action.payload.tableOverview;
            state.recentOrders = action.payload.recentOrders;
            state.topFoods = action.payload.topFoods;
            state.loading = false;
            state.error = null;
        },
        fetchSummaryDataFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },
    },
});

export const {
    fetchSummaryDataRequest,
    fetchSummaryDataSuccess,
    fetchSummaryDataFailure,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;