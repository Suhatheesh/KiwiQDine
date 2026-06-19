import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { EnableServiceChargeRequest, InitialPaymentType, PaymentProcessRequest } from "./types";
import { OrderItemResponse } from "../orders/types";

const initialState: InitialPaymentType = {
    payment: [],
    isPaymentConfirm: false,
    loading: false,
    error: null,
    isServiceChargeEnabled: false
}

const paymentSlice = createSlice({
    name: '/paymentSlice',
    initialState: initialState,
    reducers: {
        resetStates: (state) => {
            state.isPaymentConfirm = false;
            state.loading = false;
            state.error = null;
        },

        processPaymentRequest: (state, _: PayloadAction<PaymentProcessRequest>) => {
            state.loading = true;
            state.isPaymentConfirm = false;
            state.error = null
        },
        processPaymentSuccess: (state, _: PayloadAction<OrderItemResponse>) => {
            state.loading = true;
            state.isPaymentConfirm = true;
        },
        processPaymentFaliure: (state, action: PayloadAction<string>) => {
            state.loading = true;
            state.isPaymentConfirm = false;
            state.error = action.payload
        },

        enableServiceChargeRequest: (state, _: PayloadAction<EnableServiceChargeRequest>) => {
            state.isServiceChargeEnabled = false;
            state.error = null
        },
        enableServiceChargeSuccess: (state, _: PayloadAction<OrderItemResponse>) => {
            state.isServiceChargeEnabled = true;
        },
        enableServiceChargeFaliure: (state, action: PayloadAction<string>) => {
            state.isServiceChargeEnabled = false;
            state.error = action.payload
        }
    }
})

export const {
    resetStates,

    processPaymentRequest,
    processPaymentSuccess,
    processPaymentFaliure,

    enableServiceChargeRequest,
    enableServiceChargeSuccess,
    enableServiceChargeFaliure
} = paymentSlice.actions;

export default paymentSlice.reducer;