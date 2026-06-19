import { call, CallEffect, put, PutEffect, putResolve, takeLatest } from "redux-saga/effects";
import { createRestaurantsFaliure, createRestaurantsRequest, createRestaurantsSuccess, deleteRestaurantsFaliure, deleteRestaurantsRequest, deleteRestaurantsSuccess, fetchAllRestaurantFaliure, fetchAllRestaurantRequest, fetchAllRestaurantsByTenantFaliure, fetchAllRestaurantsByTenantRequest, fetchAllRestaurantsByTenantSuccess, fetchAllRestaurantSuccess, fetchBankDetailsFaliure, fetchBankDetailsRequest, fetchBankDetailsSuccess, fetchRestaurantByIdFaliure, fetchRestaurantByIdRequest, fetchRestaurantByIdSuccess, reactivateRestaurantsFaliure, reactivateRestaurantsRequest, reactivateRestaurantsSuccess, updateBankDetailsFaliure, updateBankDetailsRequest, updateBankDetailsSuccess, updateRestaurantsFaliure, updateRestaurantsRequest, updateRestaurantsSuccess, uploadRestaurantImageFaliure, uploadRestaurantImageRequest, uploadRestaurantImageSuccess, fetchRestaurantSummaryRequest, fetchRestaurantSummarySuccess, fetchRestaurantSummaryFaliure, fetchSubscriptionOrderUsageFaliure, fetchSubscriptionOrderUsageSuccess, fetchSubscriptionOrderUsageRequest, updateGracePeriodEndDateSuccess, updateGracePeriodEndDateFaliure, updateGracePeriodEndDateRequest } from "./restaurantsSlice";
import { PayloadAction } from "@reduxjs/toolkit";
import RestaurantsAPI from "./restaurantsAPI";
import { RestaurantRequestResponse, RestaurantAllRequest, RestaurantResponse, RestaurantAllRequestByTenant, Data, Restaurant, BankDetails, RestaurantSummary, GracePeriodResponse } from "./types";
import { handleApiError } from "../../api/handleApiError";
import { fetchAllTenantRequest } from "../tenants/tenantsSlice";
import { toast } from "react-toastify";
import { base64ToFile } from "../../utils";
import { UploadMenuItemImageResponse } from "../menuItems/types";
import { SubscriptionOrderUsage } from "../subscriptions/types";

function* fetchAllRestaurantSage({ payload: arg }: PayloadAction<RestaurantAllRequest>): Generator<CallEffect | PutEffect, void, RestaurantResponse> {
    try {
        const response = yield call(RestaurantsAPI.fetchAllRestaurants, arg)
        yield putResolve(fetchAllRestaurantSuccess(response.data))
        if (Number(arg.page) <= 1) {
            yield putResolve(fetchAllTenantRequest({}))
        }
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(fetchAllRestaurantFaliure(handleApiError(error)))
    }
}

function* fetchRestaurantByIdSage({ payload: arg }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, { data: Restaurant }> {
    try {
        const response = yield call(RestaurantsAPI.fetchRestaurantById, arg)
        yield putResolve(fetchRestaurantByIdSuccess(response.data))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(fetchRestaurantByIdFaliure(handleApiError(error)))
    }
}

function* fetchAllRestaurantsByTenantSage({ payload: arg }: PayloadAction<RestaurantAllRequestByTenant>): Generator<CallEffect | PutEffect, void, Data> {
    try {
        const response = yield call(RestaurantsAPI.fetchAllRestaurantsByTenant, arg)
        yield putResolve(fetchAllRestaurantsByTenantSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(fetchAllRestaurantsByTenantFaliure(handleApiError(error)))
    }
}

function* createRestaurantsSage({ payload: args }: PayloadAction<RestaurantRequestResponse>): Generator<CallEffect | PutEffect, void, { message: string, data: Restaurant }> {
    try {
        const response = yield call(RestaurantsAPI.createRestaurants, args)
        toast.success('New restaurant added successfully!')
        yield putResolve(createRestaurantsSuccess(response.data))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(createRestaurantsFaliure(handleApiError(error)))
    }
}

function* updateRestaurantsSage({ payload: args }: PayloadAction<RestaurantRequestResponse>): Generator<CallEffect | PutEffect, void, { message: string, data: Restaurant }> {
    try {
        const response = yield call(RestaurantsAPI.updateRestaurants, args)
        toast.success(`${args.name} updated successfully!`)
        yield putResolve(updateRestaurantsSuccess(response.data))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(updateRestaurantsFaliure(handleApiError(error)))
    }
}

function* deleteRestaurantsSage({ payload: args }: PayloadAction<RestaurantRequestResponse>): Generator<CallEffect | PutEffect, void, string> {
    try {
        yield call(RestaurantsAPI.deleteRestaurants, args)
        toast.success(`${args.name} deleted successfully!`)
        yield putResolve(deleteRestaurantsSuccess(args.id!))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(deleteRestaurantsFaliure(handleApiError(error)))
    }
}

function* uploadRestaurantImageSaga({ payload: args }: PayloadAction<{ image: string }>): Generator<CallEffect | PutEffect, void, UploadMenuItemImageResponse> {
    try {
        const file = base64ToFile(args.image, "image.jpg");
        const response = yield call(RestaurantsAPI.uploadImage, file);
        yield putResolve(uploadRestaurantImageSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(uploadRestaurantImageFaliure(handleApiError(error)))
    }
}

function* fetchBankDetailsSaga({ payload: args }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, { data: BankDetails | null }> {
    try {
        const response = yield call(RestaurantsAPI.fetchBankDetails, args)
        yield putResolve(fetchBankDetailsSuccess(response.data === null ? {
            bankName: null,
            accountName: null,
            accountNumber: null,
            branch: null,
            iban: null,
            swiftCode: null
        } : response.data))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(fetchBankDetailsFaliure(handleApiError(error)))
    }
}

function* updateBankDetailsSaga({ payload: args }: PayloadAction<{ restaurantId: string, bankDetails: BankDetails }>): Generator<CallEffect | PutEffect, void, { data: BankDetails }> {
    try {
        const response = yield call(RestaurantsAPI.updateBankDetails, args.restaurantId, args.bankDetails)
        yield putResolve(updateBankDetailsSuccess(response.data))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(updateBankDetailsFaliure(handleApiError(error)))
    }
}

function* reactivateRestaurantsSaga({ payload: args }: PayloadAction<{ tenantId: string, restaurantId: string }>): Generator<CallEffect | PutEffect, void, { data: Restaurant }> {
    try {
        const response = yield call(RestaurantsAPI.reactivateRestaurant, args.tenantId, args.restaurantId)
        toast.success('Restaurant reactivated successfully!')
        yield putResolve(reactivateRestaurantsSuccess(response.data))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(reactivateRestaurantsFaliure(handleApiError(error)))
    }
}

function* fetchRestaurantSummarySaga({ payload: period }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, RestaurantSummary> {
    try {
        const response = yield call(RestaurantsAPI.fetchRestaurantSummary, period);
        yield putResolve(fetchRestaurantSummarySuccess(response));
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(fetchRestaurantSummaryFaliure(handleApiError(error)));
    }
}

function* fetchSubscriptionOrderUsage({ payload: args }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, SubscriptionOrderUsage> {
    try {
        const response = yield call(RestaurantsAPI.fetchSubscriptionOrderUsage, args);
        yield putResolve(fetchSubscriptionOrderUsageSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(fetchSubscriptionOrderUsageFaliure(handleApiError(error)))
    }
}

function* updateGracePeriodEndDateSaga({ payload: args }: PayloadAction<{ restaurantId: string, gracePeriodEndDate: string }>): Generator<CallEffect | PutEffect, void, GracePeriodResponse> {
    try {
        const response = yield call(RestaurantsAPI.updateGracePeriodEndDate, args.restaurantId, args.gracePeriodEndDate)
        toast.success('Grace period end date updated successfully!')
        yield putResolve(updateGracePeriodEndDateSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(updateGracePeriodEndDateFaliure(handleApiError(error)))
    }
}

export function* watchRestaurantSaga() {
    yield takeLatest(fetchAllRestaurantRequest.type, fetchAllRestaurantSage)
    yield takeLatest(fetchRestaurantByIdRequest.type, fetchRestaurantByIdSage)
    yield takeLatest(fetchAllRestaurantsByTenantRequest.type, fetchAllRestaurantsByTenantSage)
    yield takeLatest(createRestaurantsRequest.type, createRestaurantsSage)
    yield takeLatest(updateRestaurantsRequest.type, updateRestaurantsSage)
    yield takeLatest(deleteRestaurantsRequest.type, deleteRestaurantsSage)
    yield takeLatest(uploadRestaurantImageRequest.type, uploadRestaurantImageSaga)
    yield takeLatest(fetchBankDetailsRequest.type, fetchBankDetailsSaga)
    yield takeLatest(updateBankDetailsRequest.type, updateBankDetailsSaga)
    yield takeLatest(reactivateRestaurantsRequest.type, reactivateRestaurantsSaga)
    yield takeLatest(fetchRestaurantSummaryRequest.type, fetchRestaurantSummarySaga)
    yield takeLatest(fetchSubscriptionOrderUsageRequest.type, fetchSubscriptionOrderUsage)
    yield takeLatest(updateGracePeriodEndDateRequest.type, updateGracePeriodEndDateSaga)
}