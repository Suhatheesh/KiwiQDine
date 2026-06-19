import { call, put, takeLatest } from "redux-saga/effects";
import { PayloadAction } from "@reduxjs/toolkit";
import TransactionsAPI from "./transactionsAPI";
import {
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
} from "./transactionsSlice";
import { TransactionFilters } from "./types";

// Fetch Wallet Balance Saga
function* fetchWalletBalanceSaga(action: PayloadAction<string>): Generator<any, void, any> {
    try {
        const response = yield call(TransactionsAPI.getWalletBalance, action.payload);
        yield put(fetchWalletBalanceSuccess(response.data));
    } catch (error: any) {
        yield put(fetchWalletBalanceFailure(error?.response?.data?.message || "Failed to fetch wallet balance"));
    }
}

// Fetch All Transactions Saga (Super Admin)
function* fetchAllTransactionsSaga(action: PayloadAction<TransactionFilters | undefined>): Generator<any, void, any> {
    try {
        const response = yield call(TransactionsAPI.getAllTransactions, action.payload);
        yield put(fetchAllTransactionsSuccess({
            transactions: response.data.transactions || response.data || [],
            total: response.data.total || response.data?.length || 0,
        }));
    } catch (error: any) {
        yield put(fetchAllTransactionsFailure(error?.response?.data?.message || "Failed to fetch transactions"));
    }
}

// Fetch Restaurant Transactions Saga
function* fetchRestaurantTransactionsSaga(
    action: PayloadAction<{ restaurantId: string; filters?: TransactionFilters }>
): Generator<any, void, any> {
    try {
        const { restaurantId, filters } = action.payload;
        const response = yield call(TransactionsAPI.getRestaurantTransactions, restaurantId, filters);
        yield put(fetchRestaurantTransactionsSuccess({
            transactions: response.data.transactions || response.data || [],
            total: response.data.total || response.data?.length || 0,
        }));
    } catch (error: any) {
        yield put(fetchRestaurantTransactionsFailure(error?.response?.data?.message || "Failed to fetch restaurant transactions"));
    }
}

// Fetch Transaction By ID Saga
function* fetchTransactionByIdSaga(action: PayloadAction<string>): Generator<any, void, any> {
    try {
        const response = yield call(TransactionsAPI.getTransactionById, action.payload);
        yield put(fetchTransactionByIdSuccess(response.data));
    } catch (error: any) {
        yield put(fetchTransactionByIdFailure(error?.response?.data?.message || "Failed to fetch transaction details"));
    }
}

// Root Saga
export default function* transactionsSaga() {
    yield takeLatest(fetchWalletBalanceRequest.type, fetchWalletBalanceSaga);
    yield takeLatest(fetchAllTransactionsRequest.type, fetchAllTransactionsSaga);
    yield takeLatest(fetchRestaurantTransactionsRequest.type, fetchRestaurantTransactionsSaga);
    yield takeLatest(fetchTransactionByIdRequest.type, fetchTransactionByIdSaga);
}
