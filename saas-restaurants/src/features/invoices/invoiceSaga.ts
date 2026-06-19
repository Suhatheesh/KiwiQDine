import { call, CallEffect, put, PutEffect, takeLatest } from "redux-saga/effects";
import InvoiceAPI from "./invoiceAPI";
import { InvoicePayResponse, InvoiceRequest, InvoiceResponse, InvoiceSummary } from "./types";
import { fetchInvoicesSuccess, fetchInvoicesFailure, fetchInvoices, fetchInvoiceByRestaurantId, fetchInvoiceByRestaurantIdFailure, fetchInvoiceByRestaurantIdSuccess, fetchInvoiceSummarySuccess, fetchInvoiceSummaryFailure, fetchInvoiceSummary, payInvoiceSuccess, payInvoiceFailure, payInvoice } from "./invoiceSlice";
import { PayloadAction } from "@reduxjs/toolkit";

function* fetchInvoicesSaga({ payload }: PayloadAction<InvoiceRequest>): Generator<CallEffect | PutEffect, void, { data: InvoiceResponse }> {
    try {
        const response = yield call(InvoiceAPI.fetchInvoices, payload);
        yield put(fetchInvoicesSuccess(response.data));
    } catch (error) {
        yield put(fetchInvoicesFailure(error));
    }
}

function* fetchInvoiceByRestaurantIdSaga({ payload }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, any> {
    try {
        const response = yield call(InvoiceAPI.fetchInvoiceByRestaurantId, payload);
        yield put(fetchInvoiceByRestaurantIdSuccess(response.data));
    } catch (error) {
        yield put(fetchInvoiceByRestaurantIdFailure(error));
    }
}

function* fetchInvoiceSummarySaga(): Generator<CallEffect | PutEffect, void, { data: InvoiceSummary }> {
    try {
        const response = yield call(InvoiceAPI.fetchInvoiceSummary);
        yield put(fetchInvoiceSummarySuccess(response.data));
    } catch (error) {
        yield put(fetchInvoiceSummaryFailure(error));
    }
}

function* payInvoiceSaga({ payload }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, InvoicePayResponse> {
    try {
        const response = yield call(InvoiceAPI.payInvoice, payload);
        yield put(payInvoiceSuccess(response));
    } catch (error) {
        yield put(payInvoiceFailure(error));
    }
}

export function* watchInvoiceSaga() {
    yield takeLatest(fetchInvoices.type, fetchInvoicesSaga);
    yield takeLatest(fetchInvoiceByRestaurantId.type, fetchInvoiceByRestaurantIdSaga);
    yield takeLatest(fetchInvoiceSummary.type, fetchInvoiceSummarySaga);
    yield takeLatest(payInvoice.type, payInvoiceSaga);
}