import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CreateQRRquest, FetchQRRequest, InitialQRType, QR } from "./types";

const initaiState: InitialQRType = {
    qr: [],
    isCreateQR: false,
    loading: false,
    error: null,
    isDeleteQR: false
}

const qrSlice = createSlice({
    name: '/qrSlice',
    initialState: initaiState,
    reducers: {

        /** Fetch all QR **/
        fetchAllQRRequest: (state, _: PayloadAction<FetchQRRequest>) => {
            state.loading = true;
            state.error = null;
        },
        fetchAllQRSuccess: (state, action: PayloadAction<QR[]>) => {
            state.loading = false;
            state.qr = action.payload;
        },
        fetchAllQRFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        /** Create all QR **/
        createQRRequest: (state, _: PayloadAction<CreateQRRquest>) => {
            state.loading = true;
            state.error = null;
        },
        createQRSuccess: (state, action: PayloadAction<QR>) => {
            state.loading = false;
            state.isCreateQR = true;
            state.qr = [action.payload, ...state.qr]
        },
        createQRFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        /** Update QR **/
        updateQRRequest: (state, _: PayloadAction<{ status: string, id: string }>) => {
            state.loading = true;
            state.error = null;
        },
        updateQRSuccess: (state, action: PayloadAction<QR>) => {
            state.loading = false;
            state.qr = state.qr.map((i) => i.id === action.payload.id ? action.payload : i);
        },
        updateQRFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        /** Deletel QR **/
        deleteQRRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.isDeleteQR = false;
            state.error = null;
        },
        deleteQRSuccess: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isDeleteQR = true;
            state.qr = state.qr.filter((i) => !action.payload.includes(i.id));
        },
        deleteQRFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isDeleteQR = false;
            state.error = action.payload;
        }
    }
})

export const {
    fetchAllQRRequest,
    fetchAllQRSuccess,
    fetchAllQRFaliure,

    createQRRequest,
    createQRSuccess,
    createQRFaliure,

    updateQRRequest,
    updateQRSuccess,
    updateQRFaliure,

    deleteQRRequest,
    deleteQRSuccess,
    deleteQRFaliure

} = qrSlice.actions;

export default qrSlice.reducer;