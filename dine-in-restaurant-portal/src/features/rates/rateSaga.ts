import { call, CallEffect, put, PutEffect, takeLatest } from "redux-saga/effects";
import { fetchOrderRateFailure, fetchOrderRateRequest, fetchOrderRateSuccess } from "./rateSlice";
import RateAPI from "./rateAPI";
import { RateResponse } from "./types";
import { PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { handleApiError } from "../../api/handleApiError";

function* fetchOrderRateSaga({ payload }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, RateResponse> {
    try {
        const response = yield call(RateAPI.fetchOrderRate, payload)
        yield put(fetchOrderRateSuccess(response.data[0]))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(fetchOrderRateFailure(handleApiError(error)))
    }
}

export function* watchRateSaga() {
    yield takeLatest(fetchOrderRateRequest.type, fetchOrderRateSaga)
}