import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CustomerInsertRequest, CustomerResponse, InitialCustomerType } from "./types";

const initialState: InitialCustomerType = {
    customers: null,
    loading: false,
    error: null,
}

const customerSlice = createSlice({
    name: "customer",
    initialState: initialState,
    reducers: {
        resetCustomers: (state) => {
            state.customers = null;
            state.loading = false;
            state.error = null;
        },

        fetchCustomersByNumberRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.customers = null;
            state.error = null;
        },
        fetchCustomersByNumberSuccess: (state, action: PayloadAction<CustomerResponse>) => {
            state.loading = false;
            state.customers = action.payload.data;
        },
        fetchCustomersByNumberFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        insertCustomerRequest: (state, _: PayloadAction<CustomerInsertRequest>) => {
            state.loading = true;
            state.customers = null;
            state.error = null;
        },
        insertCustomerSuccess: (state) => {
            state.loading = false;
        },
        insertCustomerFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        }
    }
});

export const {
    resetCustomers,

    fetchCustomersByNumberRequest,
    fetchCustomersByNumberSuccess,
    fetchCustomersByNumberFailure,
    insertCustomerRequest,
    insertCustomerSuccess,
    insertCustomerFailure
} = customerSlice.actions;
export default customerSlice.reducer;