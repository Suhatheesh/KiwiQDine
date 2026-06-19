import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CreateTableRequest, FetchAllTableResponse, FetchTablesRequest, InitialTableType, Table, UpdateTableRequest, UpdateTableStatusRequest } from "./types";

const initialState: InitialTableType = {
    data: [],
    table: null,
    loading: false,
    error: null,
    isTableCreated: false,
    isTableUpdated: false,
    isTableDeleted: false,
    total: 0,
    page: "",
    limit: "",
    totalPages: 0
}

const tablesSlice = createSlice({
    name: '/tablesSlice',
    initialState: initialState,
    reducers: {
        /* Fetch Tables */
        fetchTablesRequest: (state, _: PayloadAction<FetchTablesRequest | undefined>) => {
            state.loading = true;
            state.error = null;
        },
        fetchTablesSuccess: (state, action: PayloadAction<FetchAllTableResponse>) => {
            const { limit, page, total, totalPages, data } = action.payload
            state.loading = false;
            state.data = data
            state.limit = limit;
            state.page = page
            state.total = total
            state.totalPages = totalPages
        },
        fetchTablesFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        /* Create Table */
        createTableRequest: (state, _: PayloadAction<CreateTableRequest>) => {
            state.loading = true;
            state.isTableCreated = false;
            state.error = null;
        },
        createTableSuccess: (state, action: PayloadAction<Table>) => {
            state.loading = false;
            state.isTableCreated = true;
            state.data = [action.payload, ...state.data!];
        },
        createTableFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isTableCreated = false;
            state.error = action.payload;
        },

        /* Update Table */
        updateTableRequest: (state, _: PayloadAction<UpdateTableRequest>) => {
            state.loading = true;
            state.isTableUpdated = false;
            state.error = null;
        },
        updateTableSuccess: (state, action: PayloadAction<Table>) => {
            state.loading = false;
            state.isTableUpdated = true;
            state.data = state.data?.map((table) =>
                table.id === action.payload.id ? action.payload : table
            );
        },
        updateTableFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isTableUpdated = false;
            state.error = action.payload;
        },

        /* Delete Table */
        deleteTableRequest: (state, _: PayloadAction<{ tableId: string, restaurantId: string }>) => {
            state.loading = true;
            state.isTableDeleted = false;
            state.error = null;
        },
        deleteTableSuccess: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isTableDeleted = true;
            state.data = state.data?.filter((table) => table.id !== action.payload);
        },
        deleteTableFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isTableDeleted = false;
            state.error = action.payload;
        },

        /* Update Status Table */
        updateTableStatusRequest: (state, _: PayloadAction<UpdateTableStatusRequest>) => {
            state.loading = true;
            state.isTableUpdated = false;
            state.error = null;
        },
    }
});

export const {
    fetchTablesRequest,
    fetchTablesSuccess,
    fetchTablesFailure,

    createTableRequest,
    createTableSuccess,
    createTableFailure,

    updateTableRequest,
    updateTableSuccess,
    updateTableFailure,

    deleteTableRequest,
    deleteTableSuccess,
    deleteTableFailure,

    updateTableStatusRequest
} = tablesSlice.actions;

export default tablesSlice.reducer;
