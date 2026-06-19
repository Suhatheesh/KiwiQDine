import { PayloadAction } from "@reduxjs/toolkit";
import { PaymentProcessRequest, PaymentProcessResponse } from "./types";
import { toast } from "react-toastify";
import { CallEffect, PutEffect, call, putResolve, put, takeLatest } from "redux-saga/effects";
import { handleApiError } from "../../api/handleApiError";
import { PaymentAPI } from "./paymentAPI";
import { processPaymentFaliure, processPaymentRequest, processPaymentSuccess } from "./paymentSlice";

function* ProcessPaymentSaga({ payload: args }: PayloadAction<PaymentProcessRequest>): Generator<CallEffect | PutEffect, void, PaymentProcessResponse> {
    try {
        const response = yield call(PaymentAPI.paymentProcess, args);
        toast.success("Payment successfully!")
        yield putResolve(processPaymentSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(processPaymentFaliure(handleApiError(error)))
    }
}

export function* watchPaymentsSaga() {
    yield takeLatest(processPaymentRequest.type, ProcessPaymentSaga)
}