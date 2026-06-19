import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { InitialPaymentType, PaymentProcessRequest, PaymentProcessResponse, UpdateRestaurantWalletDto, UpdateRestaurantWalletResponse } from "./types";

const initialState: InitialPaymentType = {
    payment: null,
    isPaymentConfirm: false,
    loading: false,
    error: null
}

const paymentSlice = createSlice({
    name: '/paymentSlice',
    initialState: initialState,
    reducers: {
        resetStates: (state) => {
            state.isPaymentConfirm = false;
            state.loading = false;
            state.error = null;
            state.payment = null;
        },

        processPaymentRequest: (state, _: PayloadAction<PaymentProcessRequest>) => {
            state.loading = true;
            state.isPaymentConfirm = false;
            state.error = null
        },
        processPaymentSuccess: (state, action: PayloadAction<PaymentProcessResponse>) => {
            state.loading = true;
            state.isPaymentConfirm = true;
            state.payment = action.payload
        },
        processPaymentFaliure: (state, action: PayloadAction<string>) => {
            state.loading = true;
            state.isPaymentConfirm = false;
            state.error = action.payload
        },

        // Wallet update reducers (separate flow)
        updateRestaurantWalletRequest: (state, _: PayloadAction<UpdateRestaurantWalletDto>) => {
            state.loading = true;
        },
        updateRestaurantWalletSuccess: (state, _: PayloadAction<UpdateRestaurantWalletResponse>) => {
            state.loading = false;
        },
        updateRestaurantWalletFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

    }
})

export const {
    resetStates,

    processPaymentRequest,
    processPaymentSuccess,
    processPaymentFaliure,

    updateRestaurantWalletRequest,
    updateRestaurantWalletSuccess,
    updateRestaurantWalletFailure
} = paymentSlice.actions;

export default paymentSlice.reducer;