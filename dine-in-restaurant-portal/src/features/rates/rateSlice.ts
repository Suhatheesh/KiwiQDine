import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { InitialRateState, Rate } from "./types";

const initialState: InitialRateState = {
    rate: null,
    loading: false,
    error: null
}

const rateSlice = createSlice({
    name: "rate",
    initialState,
    reducers: {
        fetchOrderRateRequest: (state, _: PayloadAction<string>) => {
            state.loading = true
            state.error = null
        },
        fetchOrderRateSuccess: (state, action: PayloadAction<Rate>) => {
            state.loading = false
            state.rate = action.payload
        },
        fetchOrderRateFailure: (state, action: PayloadAction<string>) => {
            state.loading = false
            state.error = action.payload
        },
    },
})

export const { fetchOrderRateRequest, fetchOrderRateSuccess, fetchOrderRateFailure } = rateSlice.actions
export default rateSlice.reducer