import { put, call, CallEffect, PutEffect, takeLatest } from "redux-saga/effects";
import { fetchAnalyticsDataRequest, fetchAnalyticsDataSuccess, fetchAnalyticsDataFailure, fetchOrderAnalyticsDataSuccess, fetchOrderAnalyticsDataFailure, fetchOrderAnalyticsDataRequest, fetchKotAnalyticsDataSuccess, fetchKotAnalyticsDataFailure, fetchKotAnalyticsDataRequest } from "./analyticsSlice";
import { AnalyticsData, OrderAnalyticsData } from "./types";
import AnalyticsAPI from "./analyticsAPI";
import { handleApiError } from "../../api/handleApiError";
import { PayloadAction } from "@reduxjs/toolkit";
import { AnalyticsFilters } from "./types";
import { toast } from "react-toastify";

function* fetchAnalyticsDataSaga(action: PayloadAction<AnalyticsFilters | undefined>): Generator<CallEffect | PutEffect, void, AnalyticsData> {
    try {
        const response = yield call(AnalyticsAPI.fetchAnalyticsData, action.payload);
        const data = (response as any).data || response;
        yield put(fetchAnalyticsDataSuccess(data));
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(fetchAnalyticsDataFailure(handleApiError(error)));
    }
}

function* fetchOrderAnalyticsDataSaga(action: PayloadAction<{ restaurantId: string }>): Generator<CallEffect | PutEffect, void, OrderAnalyticsData> {
    try {
        const response = yield call(AnalyticsAPI.orderAnalytics, action.payload.restaurantId);
        yield put(fetchOrderAnalyticsDataSuccess(response));
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(fetchOrderAnalyticsDataFailure(handleApiError(error)));
    }
}

function* fetchKotAnalyticsDataSaga(action: PayloadAction<{ restaurantId: string }>): Generator<CallEffect | PutEffect, void, OrderAnalyticsData> {
    try {
        const response = yield call(AnalyticsAPI.kotAnalytics, action.payload.restaurantId);
        yield put(fetchKotAnalyticsDataSuccess(response));
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(fetchKotAnalyticsDataFailure(handleApiError(error)));
    }
}

export function* watchAnalyticsSaga() {
    yield takeLatest(fetchAnalyticsDataRequest.type, fetchAnalyticsDataSaga);
    yield takeLatest(fetchOrderAnalyticsDataRequest.type, fetchOrderAnalyticsDataSaga);
    yield takeLatest(fetchKotAnalyticsDataRequest.type, fetchKotAnalyticsDataSaga);
}
