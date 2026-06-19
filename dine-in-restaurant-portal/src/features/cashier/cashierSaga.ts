import { call, CallEffect, put, PutEffect, takeLatest } from "redux-saga/effects";
import { PayloadAction } from "@reduxjs/toolkit";
import { FetchAllOrdersResponse } from "../orders/types";
import { fetchCashierOrdersFailure, fetchCashierOrdersRequest, fetchCashierOrdersSuccess } from "./cashierSlice";
import { handleApiError } from "../../api/handleApiError";
import { toast } from "react-toastify";
import CashierAPI from "./cashierAPI";
import { CashierOrderRequest } from "./type";

function* fetchCashierOrdersSaga({ payload }: PayloadAction<CashierOrderRequest>): Generator<CallEffect | PutEffect, void, FetchAllOrdersResponse> {
    try {
        const response = yield call(CashierAPI.fetchCashierOrders, payload);
        yield put(fetchCashierOrdersSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(fetchCashierOrdersFailure(handleApiError(error)))
    }
}

export function* watchCashierSaga() {
    yield takeLatest(fetchCashierOrdersRequest.type, fetchCashierOrdersSaga);
}