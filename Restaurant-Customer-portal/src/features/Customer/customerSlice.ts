import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CustomerOTPRequest, CustomerVerifyRequest, CustomerVerifyResponse, InitialCustomerType } from "./types";

const initialState: InitialCustomerType = {
    loading: false,
    error: null,
    customer: null,
    isOtpSend: false
}

const customerSlice = createSlice({
    name: 'customer',
    initialState: initialState,
    reducers: {
        resetCustomerState: (state) => {
            state.loading = false;
            state.customer = null;
            state.error = null;
            state.isOtpSend = false;
        },

        createCustomerOTPRequest: (state, _: PayloadAction<CustomerOTPRequest>) => {
            state.loading = true;
            state.customer = null;
            state.isOtpSend = false;
            state.error = null;
        },
        createCustomerOTPSuccess: (state) => {
            state.loading = false;
            state.isOtpSend = true;
        },
        createCustomerOTPFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isOtpSend = false;
            state.error = action.payload;
        },

        createCustomerVerifyRequest: (state, _: PayloadAction<CustomerVerifyRequest>) => {
            state.loading = true;
            state.customer = null;
            state.error = null;
        },
        createCustomerVerifySuccess: (state, action: PayloadAction<CustomerVerifyResponse>) => {
            state.loading = false;
            state.customer = action.payload;
        },
        createCustomerVerifyFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },
    },
});

export const { resetCustomerState,
    createCustomerOTPRequest,
    createCustomerOTPSuccess,
    createCustomerOTPFailure,
    createCustomerVerifyRequest,
    createCustomerVerifySuccess,
    createCustomerVerifyFailure
} = customerSlice.actions;
export default customerSlice.reducer;
