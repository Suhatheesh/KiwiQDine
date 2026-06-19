import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { InitialTransactionsState, Transaction, WalletBalance, TransactionFilters } from "./types";

const initialState: InitialTransactionsState = {
    transactions: [],
    walletBalance: null,
    selectedTransaction: null,
    total: 0,
    filters: {},
    loading: false,
    error: null,
};

const transactionsSlice = createSlice({
    name: "transactions",
    initialState,
    reducers: {
        // Fetch Wallet Balance
        fetchWalletBalanceRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.error = null;
        },
        fetchWalletBalanceSuccess: (state, action: PayloadAction<WalletBalance>) => {
            state.loading = false;
            state.walletBalance = action.payload;
        },
        fetchWalletBalanceFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        // Fetch All Transactions (Super Admin)
        fetchAllTransactionsRequest: (state, _: PayloadAction<TransactionFilters | undefined>) => {
            state.loading = true;
            state.error = null;
        },
        fetchAllTransactionsSuccess: (state, action: PayloadAction<{ transactions: Transaction[], total: number }>) => {
            state.loading = false;
            state.transactions = action.payload.transactions;
            state.total = action.payload.total;
        },
        fetchAllTransactionsFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        // Fetch Restaurant Transactions
        fetchRestaurantTransactionsRequest: (state, _: PayloadAction<{ restaurantId: string, filters?: TransactionFilters }>) => {
            state.loading = true;
            state.error = null;
        },
        fetchRestaurantTransactionsSuccess: (state, action: PayloadAction<{ transactions: Transaction[], total: number }>) => {
            state.loading = false;
            state.transactions = action.payload.transactions;
            state.total = action.payload.total;
        },
        fetchRestaurantTransactionsFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        // Fetch Single Transaction
        fetchTransactionByIdRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.error = null;
        },
        fetchTransactionByIdSuccess: (state, action: PayloadAction<Transaction>) => {
            state.loading = false;
            state.selectedTransaction = action.payload;
        },
        fetchTransactionByIdFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        // Set Filters
        setTransactionFilters: (state, action: PayloadAction<TransactionFilters>) => {
            state.filters = action.payload;
        },

        // Clear Selected Transaction
        clearSelectedTransaction: (state) => {
            state.selectedTransaction = null;
        },

        // Clear Transactions
        clearTransactions: (state) => {
            state.transactions = [];
            state.total = 0;
        },
    },
});

export const {
    fetchWalletBalanceRequest,
    fetchWalletBalanceSuccess,
    fetchWalletBalanceFailure,
    fetchAllTransactionsRequest,
    fetchAllTransactionsSuccess,
    fetchAllTransactionsFailure,
    fetchRestaurantTransactionsRequest,
    fetchRestaurantTransactionsSuccess,
    fetchRestaurantTransactionsFailure,
    fetchTransactionByIdRequest,
    fetchTransactionByIdSuccess,
    fetchTransactionByIdFailure,
    setTransactionFilters,
    clearSelectedTransaction,
    clearTransactions,
} = transactionsSlice.actions;

export default transactionsSlice.reducer;
