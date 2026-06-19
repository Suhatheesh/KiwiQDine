import { call, CallEffect, put, PutEffect, putResolve, takeLatest } from "redux-saga/effects";
import { TenantResponseLight, TenantsResponse } from "./types";
import TenantsAPI from "./tenantsAPI";
import { fetchAllTenantFaliure, fetchAllTenantRequest, fetchAllTenantSuccess, fetchTenantsIdNameFaliure, fetchTenantsIdNameRequest, fetchTenantsIdNameSuccess } from "./tenantsSlice";
import { handleApiError } from "../../api/handleApiError";

function* fetchAllTenantsSaga(): Generator<CallEffect | PutEffect, void, TenantsResponse> {
    try {
        const response = yield call(TenantsAPI.fetchAllTenants)
        yield putResolve(fetchAllTenantSuccess(response))
    } catch (error) {
        yield put(fetchAllTenantFaliure(handleApiError(error)))
    }
}

function* fetchTenantsIdNameSaga(): Generator<CallEffect | PutEffect, void, TenantResponseLight[]> {
    try {
        const response = yield call(TenantsAPI.fetchTenantsIdName)
        yield putResolve(fetchTenantsIdNameSuccess(response))
    } catch (error) {
        yield put(fetchTenantsIdNameFaliure(handleApiError(error)))
    }
}

export function* watchTenantsSaga() {
    yield takeLatest(fetchAllTenantRequest.type, fetchAllTenantsSaga)
    yield takeLatest(fetchTenantsIdNameRequest.type, fetchTenantsIdNameSaga)
}