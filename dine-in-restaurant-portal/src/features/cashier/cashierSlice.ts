import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CashierOrderRequest, InitialCashierType } from "./type";
import { FetchAllOrdersResponse } from "../orders/types";

const initialCashierState: InitialCashierType = {
    data: [],
    error: null,
    loading: false,
    total: 0,
    page: "1",
    limit: "10",
    totalPages: 0,
}

const cashierSlice = createSlice({
    name: "cashier",
    initialState: initialCashierState,
    reducers: {
        fetchCashierOrdersRequest: (state, _: PayloadAction<CashierOrderRequest>) => {
            state.loading = true;
            state.error = null;
        },
        fetchCashierOrdersSuccess: (state, action: PayloadAction<FetchAllOrdersResponse>) => {
            const { limit, page, total, totalPages, data } = action.payload
            state.loading = false;
            const merged = new Map(
                [...data].map(item => [item.id, item], ...state.data)
            );
            state.data = Array.from(merged.values());
            state.limit = limit;
            state.page = page
            state.total = total
            state.totalPages = totalPages
        },
        fetchCashierOrdersFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },
    },
})

export const { fetchCashierOrdersRequest, fetchCashierOrdersSuccess, fetchCashierOrdersFailure } = cashierSlice.actions;
export default cashierSlice.reducer;