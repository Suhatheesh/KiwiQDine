import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CanCreateOrder, CanCreateQR, CanCreateTable, CanCreateUser, InitialSubscriptionPlanType, InvoicesResponse, SubscriptionOrderUsage, SubscriptionPlan, SubscriptionUsage, UpdateSubscriptionPlan } from "./types";

const initialSubscriptionPlan: InitialSubscriptionPlanType = {
    isCreatePlan: false,
    plans: [],
    loading: false,
    error: null,
    subscriptionUsage: null,
    subscriptionSummary: {
        totalRevenue: 0,
        monthlyRevenue: 0,
        pending: 0,
        overdue: 0,
        nextBillDate: ""
    },
    canCreateOrder: null,
    currentPlanId: null,
    canCreateTable: null,
    invoices: [],
    canCreateUser: null,
    canCreateQR: null,
    subscriptionOrderUsage: null
}

const subscriptionSlice = createSlice({
    name: '/subscriptionSlice',
    initialState: initialSubscriptionPlan,
    reducers: {
        resetState: (state) => {
            state.currentPlanId = null;
        },
        fetchSubscriptionRequest: (state, _: PayloadAction<{ status: string, includeArchived: boolean }>) => {
            state.loading = true;
            state.error = null;
        },
        fetchSubscriptionSuccess: (state, action: PayloadAction<SubscriptionPlan[]>) => {
            state.loading = false;
            state.plans = action.payload;
        },
        fetchSubscriptionFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        /* Change Plan */
        changePlanRequest: (state, _: PayloadAction<UpdateSubscriptionPlan>) => {
            state.loading = true;
            state.error = null;
        },
        changePlanSuccess: (state, action: PayloadAction<SubscriptionPlan>) => {
            state.loading = false;
            state.currentPlanId = action.payload.planId;
        },
        changePlanFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        /* Fetch Subscription Usage */
        fetchSubscriptionUsageRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.error = null;
        },
        fetchSubscriptionUsageSuccess: (state, action: PayloadAction<SubscriptionUsage>) => {
            state.loading = false;
            state.subscriptionUsage = action.payload;
        },
        fetchSubscriptionUsageFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        /* Fetch Subscription Summary */
        fetchSubscriptionSummaryRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.error = null;
        },
        fetchSubscriptionSummarySuccess: (state, action: PayloadAction<InvoicesResponse[]>) => {
            state.loading = false;
            state.invoices = action.payload;
        },
        fetchSubscriptionSummaryFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        /* Fetch Can Create Order */
        fetchCanCreateOrderRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.error = null;
        },
        fetchCanCreateOrderSuccess: (state, action: PayloadAction<CanCreateOrder>) => {
            state.loading = false;
            state.canCreateOrder = action.payload;
        },
        fetchCanCreateOrderFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        /* Fetch Can Create Table */
        fetchCanCreateTableRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.error = null;
        },
        fetchCanCreateTableSuccess: (state, action: PayloadAction<CanCreateTable>) => {
            state.loading = false;
            state.canCreateTable = action.payload;
        },
        fetchCanCreateTableFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        /* Fetch Can Create User */
        fetchCanUserCreateRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.error = null;
        },
        fetchCanUserCreateSuccess: (state, action: PayloadAction<CanCreateUser>) => {
            state.loading = false;
            state.canCreateUser = action.payload;
        },
        fetchCanUserCreateFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        /* Fetch Can Create QR */
        fetchCanQRCreateRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.error = null;
        },
        fetchCanQRCreateSuccess: (state, action: PayloadAction<CanCreateQR>) => {
            state.loading = false;
            state.canCreateQR = action.payload;
        },
        fetchCanQRCreateFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        /* Fetch Subscription Order Usage */
        fetchSubscriptionOrderUsageRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.error = null;
        },
        fetchSubscriptionOrderUsageSuccess: (state, action: PayloadAction<SubscriptionOrderUsage>) => {
            state.loading = false;
            state.subscriptionOrderUsage = action.payload;
        },
        fetchSubscriptionOrderUsageFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },
    }
});

export const {
    resetState,
    fetchSubscriptionRequest,
    fetchSubscriptionSuccess,
    fetchSubscriptionFaliure,
    fetchSubscriptionUsageRequest,
    fetchSubscriptionUsageSuccess,
    fetchSubscriptionUsageFaliure,
    fetchSubscriptionSummaryRequest,
    fetchSubscriptionSummarySuccess,
    fetchSubscriptionSummaryFaliure,
    changePlanRequest,
    changePlanSuccess,
    changePlanFaliure,
    fetchCanCreateOrderRequest,
    fetchCanCreateOrderSuccess,
    fetchCanCreateOrderFaliure,
    fetchCanCreateTableRequest,
    fetchCanCreateTableSuccess,
    fetchCanCreateTableFaliure,
    fetchCanUserCreateRequest,
    fetchCanUserCreateSuccess,
    fetchCanUserCreateFaliure,
    fetchCanQRCreateRequest,
    fetchCanQRCreateSuccess,
    fetchCanQRCreateFaliure,
    fetchSubscriptionOrderUsageRequest,
    fetchSubscriptionOrderUsageSuccess,
    fetchSubscriptionOrderUsageFaliure,
} = subscriptionSlice.actions;

export default subscriptionSlice.reducer;