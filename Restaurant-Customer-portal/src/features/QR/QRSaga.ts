
import { call, CallEffect, put, PutEffect, putResolve, takeLatest } from "redux-saga/effects";
import { QRAPI } from "./QRAPI";
import { PayloadAction } from "@reduxjs/toolkit";
import { handleApiError } from "../../api/handleApiError";
import { fetchQRSuccess, fetchQRFaliure, fetchQRRequest } from "./QRSlice";
import { QRRestaurant } from "./types";
import { toast } from "react-toastify";

function* fetchQRSaga({ payload: args }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, QRRestaurant> {
    try {
        const response = yield call(QRAPI.fetchQR, args);
        yield putResolve(fetchQRSuccess(response));
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(fetchQRFaliure(handleApiError(error)))
    }
}

export function* watchQRSaga() {
    yield takeLatest(fetchQRRequest.type, fetchQRSaga);
}