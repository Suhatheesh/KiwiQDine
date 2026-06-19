import { call, CallEffect, put, PutEffect, putResolve, takeLatest } from "redux-saga/effects";
import { changePlanFaliure, changePlanRequest, changePlanSuccess, fetchCanCreateOrderFaliure, fetchCanCreateOrderRequest, fetchCanCreateOrderSuccess, fetchCanCreateTableFaliure, fetchCanCreateTableRequest, fetchCanCreateTableSuccess, fetchCanQRCreateFaliure, fetchCanQRCreateRequest, fetchCanQRCreateSuccess, fetchCanUserCreateFaliure, fetchCanUserCreateRequest, fetchCanUserCreateSuccess, fetchSubscriptionFaliure, fetchSubscriptionOrderUsageFaliure, fetchSubscriptionOrderUsageRequest, fetchSubscriptionOrderUsageSuccess, fetchSubscriptionRequest, fetchSubscriptionSuccess, fetchSubscriptionSummaryFaliure, fetchSubscriptionSummaryRequest, fetchSubscriptionSummarySuccess, fetchSubscriptionUsageFaliure, fetchSubscriptionUsageRequest, fetchSubscriptionUsageSuccess } from "./subscriptionsSlice";
import { PayloadAction } from "@reduxjs/toolkit";
import { handleApiError } from "../../api/handleApiError";
import SubscriptionsAPI from "./subscriptionsAPI";
import { toast } from "react-toastify";
import { CanCreateOrder, CanCreateQR, CanCreateTable, CanCreateUser, InvoicesResponse, SubscriptionOrderUsage, SubscriptionPlan, SubscriptionUsage, UpdateSubscriptionPlan } from "./types";

function* fetchAllSubscriptionPlans(): Generator<CallEffect | PutEffect, void, SubscriptionPlan[]> {
    try {
        const response = yield call(SubscriptionsAPI.fetchAllPlans);
        yield putResolve(fetchSubscriptionSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(fetchSubscriptionFaliure(handleApiError(error)))
    }
}

function* fetchSubscriptionUsage({ payload: args }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, SubscriptionUsage> {
    try {
        const response = yield call(SubscriptionsAPI.fetchSubscriptionUsage, args);
        yield putResolve(fetchSubscriptionUsageSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(fetchSubscriptionUsageFaliure(handleApiError(error)))
    }
}

function* fetchSubscriptionSummary({ payload: args }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, { data: InvoicesResponse[] }> {
    try {
        const response = yield call(SubscriptionsAPI.fetchSubscriptionSummary, args);
        yield putResolve(fetchSubscriptionSummarySuccess(response.data))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(fetchSubscriptionSummaryFaliure(handleApiError(error)))
    }
}

function* changePlan({ payload: args }: PayloadAction<UpdateSubscriptionPlan>): Generator<CallEffect | PutEffect, void, SubscriptionPlan> {
    try {
        const response = yield call(SubscriptionsAPI.changePlan, args);
        yield putResolve(changePlanSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(changePlanFaliure(handleApiError(error)))
    }
}

function* fetchCanCreateOrder({ payload: args }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, CanCreateOrder> {
    try {
        const response = yield call(SubscriptionsAPI.checkCanCreateOrder, args);
        yield putResolve(fetchCanCreateOrderSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(fetchCanCreateOrderFaliure(handleApiError(error)))
    }
}

function* fetchCanCreateTable({ payload: args }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, CanCreateTable> {
    try {
        const response = yield call(SubscriptionsAPI.checkCanTableCreate, args);
        yield putResolve(fetchCanCreateTableSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(fetchCanCreateTableFaliure(handleApiError(error)))
    }
}

function* fetchCanUserCreate({ payload: args }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, CanCreateUser> {
    try {
        const response = yield call(SubscriptionsAPI.checkCanUserCreate, args);
        yield putResolve(fetchCanUserCreateSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(fetchCanUserCreateFaliure(handleApiError(error)))
    }
}

function* fetchCanQRCreate({ payload: args }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, CanCreateQR> {
    try {
        const response = yield call(SubscriptionsAPI.checkCanQRCreate, args);
        yield putResolve(fetchCanQRCreateSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(fetchCanQRCreateFaliure(handleApiError(error)))
    }
}

function* fetchSubscriptionOrderUsage({ payload: args }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, SubscriptionOrderUsage> {
    try {
        const response = yield call(SubscriptionsAPI.fetchSubscriptionOrderUsage, args);
        yield putResolve(fetchSubscriptionOrderUsageSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(fetchSubscriptionOrderUsageFaliure(handleApiError(error)))
    }
}

export function* watchSubscriptionSaga() {
    yield takeLatest(fetchSubscriptionRequest.type, fetchAllSubscriptionPlans);
    yield takeLatest(fetchSubscriptionUsageRequest.type, fetchSubscriptionUsage);
    yield takeLatest(fetchSubscriptionSummaryRequest.type, fetchSubscriptionSummary);
    yield takeLatest(changePlanRequest.type, changePlan);
    yield takeLatest(fetchCanCreateOrderRequest.type, fetchCanCreateOrder);
    yield takeLatest(fetchCanCreateTableRequest.type, fetchCanCreateTable);
    yield takeLatest(fetchCanUserCreateRequest.type, fetchCanUserCreate);
    yield takeLatest(fetchCanQRCreateRequest.type, fetchCanQRCreate);
    yield takeLatest(fetchSubscriptionOrderUsageRequest.type, fetchSubscriptionOrderUsage);
}