import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { InitialAddOnType, FetchAllAddOnResponse, CreateAddOnRequest, AddOn } from "./types";

const initialState: InitialAddOnType = {
    loading: false,
    error: null,
    data: [],
    isCreateAddOn: false,
    isUpdateAddOn: false,
    isDeleteAddOn: false,
    total: 0,
    page: "1",
    limit: "10",
    totalPages: 0
};

const addOnSlice = createSlice({
    name: "addOn",
    initialState,
    reducers: {
        // Fetch All
        fetchAllAddOnRequest: (state, _action: PayloadAction<string>) => {
            state.loading = true;
            state.error = null;
        },
        fetchAllAddOnSuccess: (state, action: PayloadAction<FetchAllAddOnResponse>) => {
            state.loading = false;
            state.data = action.payload.data;
        },
        fetchAllAddOnFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        // Create
        createAddOnRequest: (state, _action: PayloadAction<CreateAddOnRequest>) => {
            state.loading = true;
            state.error = null;
            state.isCreateAddOn = false;
        },
        createAddOnSuccess: (state, action: PayloadAction<AddOn>) => {
            state.loading = false;
            state.data = [...state.data, action.payload];
            state.isCreateAddOn = true;
        },
        createAddOnFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
            state.isCreateAddOn = false;
        },

        // Update
        updateAddOnRequest: (state, _action: PayloadAction<CreateAddOnRequest>) => {
            state.loading = true;
            state.error = null;
            state.isUpdateAddOn = false;
        },
        updateAddOnSuccess: (state, action: PayloadAction<AddOn>) => {
            state.loading = false;
            state.data = state.data.map((item) => item.id === action.payload.id ? action.payload : item);
            state.isUpdateAddOn = true;
        },
        updateAddOnFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
            state.isUpdateAddOn = false;
        },

        // Delete
        deleteAddOnRequest: (state, _action: PayloadAction<string>) => {
            state.loading = true;
            state.error = null;
            state.isDeleteAddOn = false;
        },
        deleteAddOnSuccess: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.data = state.data.filter((item) => item.id !== action.payload);
            state.isDeleteAddOn = true;
        },
        deleteAddOnFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
            state.isDeleteAddOn = false;
        },

        // Reset
        resetAddOn: (state) => {
            state.isCreateAddOn = false;
            state.isUpdateAddOn = false;
            state.isDeleteAddOn = false;
            state.error = null;
        }
    },
});

export const {
    fetchAllAddOnRequest,
    fetchAllAddOnSuccess,
    fetchAllAddOnFailure,
    createAddOnRequest,
    createAddOnSuccess,
    createAddOnFailure,
    updateAddOnRequest,
    updateAddOnSuccess,
    updateAddOnFailure,
    deleteAddOnRequest,
    deleteAddOnSuccess,
    deleteAddOnFailure,
    resetAddOn
} = addOnSlice.actions;

export default addOnSlice.reducer;
