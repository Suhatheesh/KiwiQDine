import { call, CallEffect, put, PutEffect, takeLatest } from "redux-saga/effects";
import { CustomerInsertRequest, CustomerResponse } from "./types";
import CustomerAPI from "./customerAPI";
import { PayloadAction } from "@reduxjs/toolkit";
import { handleApiError } from "../../api/handleApiError";
import { fetchCustomersByNumberFailure, fetchCustomersByNumberRequest, fetchCustomersByNumberSuccess, insertCustomerFailure, insertCustomerRequest, insertCustomerSuccess } from "./customerSlice";
import { toast } from "react-toastify";
import { Customer } from "../orders/types";

function* fetchCustomersByNumberSaga(action: PayloadAction<string>): Generator<CallEffect | PutEffect, void, CustomerResponse> {
    try {
        const response = yield call(CustomerAPI.searchCustomers, action.payload);
        yield put(fetchCustomersByNumberSuccess(response));
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(fetchCustomersByNumberFailure(handleApiError(error)));
    }
}

function* insertCustomerSaga(action: PayloadAction<CustomerInsertRequest>): Generator<CallEffect | PutEffect, void, Customer> {
    try {
        yield call(CustomerAPI.insertCustomer, action.payload);
        toast.success(`${action.payload.customerName} customer added successfully!`)
        yield put(insertCustomerSuccess());
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(insertCustomerFailure(handleApiError(error)));
    }
}

export function* watchCustomerSaga() {
    yield takeLatest(fetchCustomersByNumberRequest.type, fetchCustomersByNumberSaga);
    yield takeLatest(insertCustomerRequest.type, insertCustomerSaga);
}