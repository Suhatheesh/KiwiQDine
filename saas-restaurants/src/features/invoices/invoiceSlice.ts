import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { InvoiceInitialState, InvoicePayResponse, InvoiceRequest, InvoiceResponse, InvoiceSummary } from "./types";

const initialState: InvoiceInitialState = {
    loading: false,
    error: null,
    invoices: {
        data: [],
        total: 0,
        page: "1",
        limit: "10",
        totalPages: 0
    },
    summary: {
        totalRevenue: 0,
        monthlyRevenue: 0,
        pending: 0,
        overdue: 0
    }
}

const invoiceSlice = createSlice({
    name: "invoice",
    initialState,
    reducers: {
        increaseLimit: (state, action: PayloadAction<string>) => {
            state.invoices.limit = action.payload
        },
        pagination: (state, action: PayloadAction<string>) => {
            state.invoices.page = action.payload;
        },

        fetchInvoices: (state, _: PayloadAction<InvoiceRequest>) => {
            state.loading = true;
            state.error = null;
        },
        fetchInvoicesSuccess: (state, action: PayloadAction<InvoiceResponse>) => {
            const { data, total, page, limit, totalPages } = action.payload;
            state.loading = false;
            state.error = null;
            state.invoices = {
                data,
                total,
                page,
                limit,
                totalPages
            };
        },
        fetchInvoicesFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },

        fetchInvoiceByRestaurantId: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.error = null;
        },
        fetchInvoiceByRestaurantIdSuccess: (state, action: PayloadAction<any>) => {
            state.loading = false;
            state.error = null;
            state.invoices = action.payload;
        },
        fetchInvoiceByRestaurantIdFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },

        fetchInvoiceSummary: (state) => {
            state.loading = true;
            state.error = null;
        },
        fetchInvoiceSummarySuccess: (state, action: PayloadAction<InvoiceSummary>) => {
            state.loading = false;
            state.error = null;
            state.summary = action.payload;
        },
        fetchInvoiceSummaryFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },

        payInvoice: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.error = null;
        },
        payInvoiceSuccess: (state, action: PayloadAction<InvoicePayResponse>) => {
            state.loading = false;
            state.error = null;
            state.invoices.data = state.invoices.data.map((invoice) => {
                if (invoice.id === action.payload.data.id) {
                    invoice.status = "paid";
                    invoice.paid_date = action.payload.data.paid_date;
                }
                return invoice;
            })
        },
        payInvoiceFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
    }
})

export const {
    increaseLimit,
    pagination,

    fetchInvoices,
    fetchInvoicesSuccess,
    fetchInvoicesFailure,
    fetchInvoiceByRestaurantId,
    fetchInvoiceByRestaurantIdSuccess,
    fetchInvoiceByRestaurantIdFailure,
    fetchInvoiceSummary,
    fetchInvoiceSummarySuccess,
    fetchInvoiceSummaryFailure,
    payInvoice,
    payInvoiceSuccess,
    payInvoiceFailure,
} = invoiceSlice.actions;
export default invoiceSlice.reducer;
