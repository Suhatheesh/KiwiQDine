import { call, CallEffect, put, PutEffect, putResolve, takeLatest } from "redux-saga/effects";
import { CanCreateQR, CanCreateTable, CanCreateUser, CreateSubscriptionPlan, CurrentPlanResponseDto, fetchSubscriptionPlan, SubscriptionPlan } from "./types";
import { createSubscriptionFaliure, createSubscriptionRequest, createSubscriptionSuccess, fetchSubscriptionFaliure, fetchSubscriptionRequest, fetchSubscriptionSuccess, updateSubscriptionFaliure, updateSubscriptionRequest, updateSubscriptionSuccess, archiveSubscriptionFaliure, archiveSubscriptionRequest, archiveSubscriptionSuccess, unarchiveSubscriptionFaliure, unarchiveSubscriptionRequest, unarchiveSubscriptionSuccess, deleteSubscriptionFaliure, deleteSubscriptionRequest, deleteSubscriptionSuccess, createSpecialSubscriptionSuccess, createSpecialSubscriptionFaliure, createSpecialSubscriptionRequest, fetchCanCreateTableFaliure, fetchCanCreateTableSuccess, fetchCanQRCreateFaliure, fetchCanQRCreateSuccess, fetchCanUserCreateFaliure, fetchCanUserCreateSuccess, fetchCanCreateTableRequest, fetchCanQRCreateRequest, fetchCanUserCreateRequest, fetchCurrentPlanSuccess, fetchCurrentPlanFaliure, fetchCurrentPlanRequest } from "./subscriptionsSlice";
import { PayloadAction } from "@reduxjs/toolkit";
import { handleApiError } from "../../api/handleApiError";
import SubscriptionsAPI from "./subscriptionsAPI";
import { toast } from "react-toastify";

function* fetchAllSubscriptionPlans({ payload: args }: PayloadAction<fetchSubscriptionPlan>): Generator<CallEffect | PutEffect, void, { data: { data: SubscriptionPlan[] } }> {
    try {
        const response = yield call(SubscriptionsAPI.fetchAllPlans, args);
        yield putResolve(fetchSubscriptionSuccess(response.data.data))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(fetchSubscriptionFaliure(handleApiError(error)))
    }
}

function* createSubscriptionPlans({ payload: args }: PayloadAction<CreateSubscriptionPlan>): Generator<CallEffect | PutEffect, void, SubscriptionPlan> {
    try {
        const response = yield call(SubscriptionsAPI.createPlan, args);
        toast.success('New subscription plan created!')
        yield putResolve(createSubscriptionSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(createSubscriptionFaliure(handleApiError(error)))
    }
}

function* updateSubscriptionPlans({ payload: args }: PayloadAction<SubscriptionPlan>): Generator<CallEffect | PutEffect, void, SubscriptionPlan> {
    try {
        const response = yield call(SubscriptionsAPI.updatePlan, args);
        toast.success(`${args.name} subscription plan updated!`)
        yield putResolve(updateSubscriptionSuccess({ ...response, olderId: args.id }))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(updateSubscriptionFaliure(handleApiError(error)))
    }
}

function* archiveSubscription({ payload: planId }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, SubscriptionPlan> {
    try {
        const response = yield call(SubscriptionsAPI.archivePlan, planId);
        toast.success('Subscription plan archived successfully!')
        yield putResolve(archiveSubscriptionSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(archiveSubscriptionFaliure(handleApiError(error)))
    }
}

function* unarchiveSubscription({ payload: planId }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, SubscriptionPlan> {
    try {
        const response = yield call(SubscriptionsAPI.unarchivePlan, planId);
        toast.success('Subscription plan unarchived successfully!')
        yield putResolve(unarchiveSubscriptionSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(unarchiveSubscriptionFaliure(handleApiError(error)))
    }
}

function* deleteSubscription({ payload: planId }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, string> {
    try {
        yield call(SubscriptionsAPI.deletePlan, planId);
        toast.success('Subscription plan deleted successfully!')
        yield putResolve(deleteSubscriptionSuccess(planId))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(deleteSubscriptionFaliure(handleApiError(error)))
    }
}

function* createSpecialSubscription({ payload: args }: PayloadAction<CreateSubscriptionPlan>): Generator<CallEffect | PutEffect, void, SubscriptionPlan[]> {
    try {
        const response = yield call(SubscriptionsAPI.createSpecialPlan, args);
        toast.success('New subscription plan created!')
        yield putResolve(createSpecialSubscriptionSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(createSpecialSubscriptionFaliure(handleApiError(error)))
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

function* fetchCurrentPlan({ payload: args }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, { data: { plan: CurrentPlanResponseDto } }> {
    try {
        const response = yield call(SubscriptionsAPI.fetchCurrentPlan, args);
        yield putResolve(fetchCurrentPlanSuccess(response.data.plan))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(fetchCurrentPlanFaliure(handleApiError(error)))
    }
}

export function* watchSubscriptionSaga() {
    yield takeLatest(fetchSubscriptionRequest.type, fetchAllSubscriptionPlans);
    yield takeLatest(createSubscriptionRequest.type, createSubscriptionPlans);
    yield takeLatest(updateSubscriptionRequest.type, updateSubscriptionPlans);
    yield takeLatest(archiveSubscriptionRequest.type, archiveSubscription);
    yield takeLatest(unarchiveSubscriptionRequest.type, unarchiveSubscription);
    yield takeLatest(deleteSubscriptionRequest.type, deleteSubscription);
    yield takeLatest(createSpecialSubscriptionRequest.type, createSpecialSubscription);
    yield takeLatest(fetchCanCreateTableRequest.type, fetchCanCreateTable);
    yield takeLatest(fetchCanUserCreateRequest.type, fetchCanUserCreate);
    yield takeLatest(fetchCanQRCreateRequest.type, fetchCanQRCreate);
    yield takeLatest(fetchCurrentPlanRequest.type, fetchCurrentPlan);
}