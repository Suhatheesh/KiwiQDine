import { call, CallEffect, put, PutEffect, putResolve, takeLatest } from "redux-saga/effects";
import { createQRFaliure, createQRRequest, createQRSuccess, deleteQRFaliure, deleteQRRequest, deleteQRSuccess, fetchAllQRFaliure, fetchAllQRRequest, fetchAllQRSuccess, updateQRFaliure, updateQRRequest, updateQRSuccess } from "./qrSlice";
import { PayloadAction } from "@reduxjs/toolkit";
import { AllQRResponse, CreateQRRquest, QR } from "./types";
import { handleApiError } from "../../api/handleApiError";
import QRAPI from "./qrAPI";
import { FetchAllRequestType } from "../../models/BaseType";
import { toast } from "react-toastify";

function* fetchAllQRSage({ payload: args }: PayloadAction<FetchAllRequestType>): Generator<CallEffect | PutEffect, void, AllQRResponse> {
    try {
        const response = yield call(QRAPI.fetchAllQR, args);
        yield putResolve(fetchAllQRSuccess(response.data))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(fetchAllQRFaliure(handleApiError(error)))
    }
}

function* createQRSage({ payload: args }: PayloadAction<CreateQRRquest>): Generator<CallEffect | PutEffect, void, QR> {
    try {
        const response = yield call(QRAPI.createQR, args);
        toast.success('Generate QR Successfully!')
        yield putResolve(createQRSuccess(response))
        yield put(fetchAllQRRequest({ restaurantId: args.restaurantId, tenantId: args.tenantId, page: 1, limit: 10 }))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(createQRFaliure(handleApiError(error)))
    }
}

function* updateStatuQRSage({ payload: args }: PayloadAction<{ status: string, id: string }>): Generator<CallEffect | PutEffect, void, any> {
    try {
        const response = yield call(QRAPI.updateStatusQR, args.status, args.id);
        toast.success(`QR ${args.status}`)
        yield putResolve(updateQRSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(updateQRFaliure(handleApiError(error)))
    }
}

function* deleteQRSage({ payload: args }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, any> {
    try {
        yield call(QRAPI.deleteQR, args);
        toast.success('Delete QR Successfully!')
        yield putResolve(deleteQRSuccess(args))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(deleteQRFaliure(handleApiError(error)))
    }
}

export function* watchQRSaga() {
    yield takeLatest(fetchAllQRRequest.type, fetchAllQRSage);
    yield takeLatest(createQRRequest.type, createQRSage);
    yield takeLatest(updateQRRequest.type, updateStatuQRSage);
    yield takeLatest(deleteQRRequest.type, deleteQRSage);
}