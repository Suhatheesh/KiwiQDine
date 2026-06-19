import { call, CallEffect, put, PutEffect, takeLatest } from "redux-saga/effects";
import { PayloadAction } from "@reduxjs/toolkit";
import { createAddOnFailure, createAddOnRequest, createAddOnSuccess, deleteAddOnFailure, deleteAddOnRequest, deleteAddOnSuccess, fetchAllAddOnFailure, fetchAllAddOnRequest, fetchAllAddOnSuccess, updateAddOnFailure, updateAddOnRequest, updateAddOnSuccess } from "./addOnSlice";
import AddOnAPI from "./addOnAPI";
import { AddOn, CreateAddOnRequest } from "./types";
import { toast } from "react-toastify";
import { handleApiError } from "../../api/handleApiError";

function* createAddOnSaga(action: PayloadAction<CreateAddOnRequest>): Generator<CallEffect | PutEffect, void, { data: AddOn }> {
    try {
        const response = yield call(AddOnAPI.createAddOn, action.payload);
        yield put(createAddOnSuccess(response.data));
    } catch (error: any) {
        toast.error(handleApiError(error));
        yield put(createAddOnFailure(error.message));
    }
}

function* updateAddOnSaga(action: PayloadAction<CreateAddOnRequest>): Generator<CallEffect | PutEffect, void, { data: AddOn }> {
    try {
        const response = yield call(AddOnAPI.updateAddOn, action.payload);
        yield put(updateAddOnSuccess(response.data));
    } catch (error: any) {
        toast.error(handleApiError(error));
        yield put(updateAddOnFailure(error.message));
    }
}

function* deleteAddOnSaga(action: PayloadAction<string>): Generator<CallEffect | PutEffect, void, any> {
    try {
        yield call(AddOnAPI.deleteAddOn, action.payload);
        yield put(deleteAddOnSuccess(action.payload));
    } catch (error: any) {
        toast.error(handleApiError(error));
        yield put(deleteAddOnFailure(error.message));
    }
}

function* fetchAllAddOnSaga(action: PayloadAction<string>): Generator<CallEffect | PutEffect, void, any> {
    try {
        const response = yield call(AddOnAPI.fetchAllAddOns, action.payload);
        yield put(fetchAllAddOnSuccess(response));
    } catch (error: any) {
        toast.error(handleApiError(error));
        yield put(fetchAllAddOnFailure(error.message));
    }
}

export function* watchAddOnSaga() {
    yield takeLatest(fetchAllAddOnRequest.type, fetchAllAddOnSaga);
    yield takeLatest(createAddOnRequest.type, createAddOnSaga);
    yield takeLatest(updateAddOnRequest.type, updateAddOnSaga);
    yield takeLatest(deleteAddOnRequest.type, deleteAddOnSaga);
}
