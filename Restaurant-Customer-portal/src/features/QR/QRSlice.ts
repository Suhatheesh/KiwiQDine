import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { InitialQRType, QRRestaurant } from "./types";

const initialState: InitialQRType = {
    item: null,
    loading: false,
    error: null
}

const qrSlice = createSlice({
    name: '/qrSlice',
    initialState: initialState,
    reducers: {
        fetchQRRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.error = null;
        },
        fetchQRSuccess: (state, action: PayloadAction<QRRestaurant>) => {
            state.loading = false;
            state.item = action.payload;
        },
        fetchQRFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        }
    }
});

export const {
    fetchQRRequest,
    fetchQRSuccess,
    fetchQRFaliure
} = qrSlice.actions;

export default qrSlice.reducer