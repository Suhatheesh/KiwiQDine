import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CanCreateQR, CanCreateTable, CanCreateUser, CreateSubscriptionPlan, CurrentPlanResponseDto, fetchSubscriptionPlan, InitialSubscriptionPlanType, SubscriptionPlan } from "./types";

const initialSubscriptionPlan: InitialSubscriptionPlanType = {
    isCreatePlan: false,
    plans: [],
    loading: false,
    error: null,
    canCreateTable: null,
    canCreateUser: null,
    canCreateQR: null,
    currentPlan: null
}

const subscriptionSlice = createSlice({
    name: '/subscriptionSlice',
    initialState: initialSubscriptionPlan,
    reducers: {
        fetchSubscriptionRequest: (state, _: PayloadAction<fetchSubscriptionPlan>) => {
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

        createSubscriptionRequest: (state, _: PayloadAction<CreateSubscriptionPlan>) => {
            state.loading = true;
            state.error = null;
        },
        createSubscriptionSuccess: (state, action: PayloadAction<SubscriptionPlan>) => {
            state.loading = false;
            state.isCreatePlan = true;
            state.plans = [...state.plans, action.payload];
        },
        createSubscriptionFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isCreatePlan = false;
            state.error = action.payload;
        },

        updateSubscriptionRequest: (state, _: PayloadAction<SubscriptionPlan>) => {
            state.loading = true;
            state.isCreatePlan = false;
            state.error = null;
        },
        updateSubscriptionSuccess: (state, action: PayloadAction<SubscriptionPlan>) => {
            state.loading = false;
            state.isCreatePlan = true;
            const index = state.plans.findIndex(plan => plan.id === action.payload.olderId);
            state.plans[index] = action.payload;
        },
        updateSubscriptionFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isCreatePlan = false;
            state.error = action.payload;
        },

        archiveSubscriptionRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.error = null;
        },
        archiveSubscriptionSuccess: (state, action: PayloadAction<SubscriptionPlan>) => {
            state.loading = false;
            state.plans = state.plans.map(plan =>
                plan.id === action.payload.id ? action.payload : plan
            );
        },
        archiveSubscriptionFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        unarchiveSubscriptionRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.error = null;
        },
        unarchiveSubscriptionSuccess: (state, action: PayloadAction<SubscriptionPlan>) => {
            state.loading = false;
            state.plans = state.plans.map(plan =>
                plan.id === action.payload.id ? action.payload : plan
            );
        },
        unarchiveSubscriptionFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },
        deleteSubscriptionRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.error = null;
        },
        deleteSubscriptionSuccess: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.plans = state.plans.filter(plan => plan.id !== action.payload);
        },
        deleteSubscriptionFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        createSpecialSubscriptionRequest: (state, _: PayloadAction<CreateSubscriptionPlan>) => {
            state.loading = true;
            state.error = null;
        },
        createSpecialSubscriptionSuccess: (state, action: PayloadAction<SubscriptionPlan[]>) => {
            state.loading = false;
            state.isCreatePlan = true;
            state.plans = [...state.plans, ...action.payload];
        },
        createSpecialSubscriptionFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isCreatePlan = false;
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

        /* Fetch Current Plan */
        fetchCurrentPlanRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.error = null;
        },
        fetchCurrentPlanSuccess: (state, action: PayloadAction<CurrentPlanResponseDto>) => {
            state.loading = false;
            state.currentPlan = action.payload;
        },
        fetchCurrentPlanFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },
    }
});

export const {
    fetchSubscriptionRequest,
    fetchSubscriptionSuccess,
    fetchSubscriptionFaliure,

    createSubscriptionRequest,
    createSubscriptionSuccess,
    createSubscriptionFaliure,

    updateSubscriptionRequest,
    updateSubscriptionSuccess,
    updateSubscriptionFaliure,

    archiveSubscriptionRequest,
    archiveSubscriptionSuccess,
    archiveSubscriptionFaliure,

    unarchiveSubscriptionRequest,
    unarchiveSubscriptionSuccess,
    unarchiveSubscriptionFaliure,

    deleteSubscriptionRequest,
    deleteSubscriptionSuccess,
    deleteSubscriptionFaliure,

    createSpecialSubscriptionRequest,
    createSpecialSubscriptionSuccess,
    createSpecialSubscriptionFaliure,

    fetchCanCreateTableRequest,
    fetchCanCreateTableSuccess,
    fetchCanCreateTableFaliure,

    fetchCanUserCreateRequest,
    fetchCanUserCreateSuccess,
    fetchCanUserCreateFaliure,

    fetchCanQRCreateRequest,
    fetchCanQRCreateSuccess,
    fetchCanQRCreateFaliure,

    fetchCurrentPlanRequest,
    fetchCurrentPlanSuccess,
    fetchCurrentPlanFaliure
} = subscriptionSlice.actions;

export default subscriptionSlice.reducer;