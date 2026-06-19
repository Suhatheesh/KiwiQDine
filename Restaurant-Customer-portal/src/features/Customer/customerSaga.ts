import { call, CallEffect, put, PutEffect, putResolve, takeLatest } from "redux-saga/effects";
import { CustomerOTPRequest, CustomerVerifyRequest, CustomerVerifyResponse } from "./types";
import { createCustomerOTPFailure, createCustomerOTPSuccess, createCustomerOTPRequest, createCustomerVerifyFailure, createCustomerVerifySuccess, createCustomerVerifyRequest } from "./customerSlice";
import { PayloadAction } from "@reduxjs/toolkit";
import CustomerAPI from "./customerAPI";
import { handleApiError } from "../../api/handleApiError";
import { toast } from "react-toastify";

function* createCustomerOTPRequestSaga({ payload }: PayloadAction<CustomerOTPRequest>): Generator<CallEffect | PutEffect, void, string> {
    try {
        yield call(CustomerAPI.customerSendOTP, payload)
        toast.success("OTP Send successfully!")
        yield putResolve(createCustomerOTPSuccess())
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(createCustomerOTPFailure(handleApiError(error)));
    }
}

function* createCustomerVerifyRequestSaga({ payload }: PayloadAction<CustomerVerifyRequest>): Generator<CallEffect | PutEffect, void, CustomerVerifyResponse> {
    try {
        const response = yield call(CustomerAPI.customerVerify, payload)
        toast.success("Customer verified successfully!")
        sessionStorage.setItem("accessToken", response.accessToken)
        sessionStorage.setItem("refreshToken", response.refreshToken)
        yield putResolve(createCustomerVerifySuccess(response))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(createCustomerVerifyFailure(handleApiError(error)));
    }
}

export function* watchCustomerSaga() {
    yield takeLatest(createCustomerOTPRequest.type, createCustomerOTPRequestSaga)
    yield takeLatest(createCustomerVerifyRequest.type, createCustomerVerifyRequestSaga)
}

