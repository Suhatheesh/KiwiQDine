import { call, CallEffect, put, PutEffect, takeLatest } from "redux-saga/effects";
import { PayloadAction } from "@reduxjs/toolkit";
import { MenuAPI } from "./menuAPI";
import { fetchMenuRequest, fetchMenuSuccess, fetchMenuFailure, fetchCategoriesSuccess, fetchCategoriesFailure, fetchCategoriesRequest, fetchFeaturedMenuSuccess, fetchFeaturedMenuFailure, fetchFeaturedMenuRequest, fetchTopSellingItemsFailure, fetchTopSellingItemsSuccess, fetchTopSellingItemsRequest } from "./menuSlice";
import { MenuAPIResponse, MenuCategory, MenuFilter, MenuItem } from "./types";
import { handleApiError } from "../../api/handleApiError";
import { toast } from "react-toastify";

function* fetchMenuSaga(action: PayloadAction<{ restaurantId: string, filter: MenuFilter }>): Generator<CallEffect | PutEffect, void, MenuAPIResponse> {
    try {
        const { restaurantId, filter } = action.payload;
        const response: MenuAPIResponse = yield call(MenuAPI.fetchFilteredMenu, restaurantId, filter);
        yield put(fetchMenuSuccess(response));
    } catch (error: any) {
        toast.error(handleApiError(error))
        yield put(fetchMenuFailure(handleApiError(error)));
    }
}

function* fetchCategoriesSaga(action: PayloadAction<{ restaurantId: string }>): Generator<CallEffect | PutEffect, void, { categories: MenuCategory[] }> {
    try {
        const { restaurantId } = action.payload;
        const response = yield call(MenuAPI.fetchCategories, restaurantId);
        yield put(fetchCategoriesSuccess(response.categories));
    } catch (error: any) {
        toast.error(handleApiError(error))
        yield put(fetchCategoriesFailure(handleApiError(error)));
    }
}

function* fetchFeaturedMenuSaga(action: PayloadAction<{ restaurantId: string }>): Generator<CallEffect | PutEffect, void, MenuItem[]> {
    try {
        const { restaurantId } = action.payload;
        const response: MenuItem[] = yield call(MenuAPI.fetchFeaturedMenu, restaurantId);
        yield put(fetchFeaturedMenuSuccess(response));
    } catch (error: any) {
        toast.error(handleApiError(error))
        yield put(fetchFeaturedMenuFailure(handleApiError(error)));
    }
}

function* fetchTopSellingItemsSaga(action: PayloadAction<{ restaurantId: string }>): Generator<CallEffect | PutEffect, void, MenuItem[]> {
    try {
        const { restaurantId } = action.payload;
        const response: MenuItem[] = yield call(MenuAPI.fetchTopSellingItems, restaurantId);
        yield put(fetchTopSellingItemsSuccess(response));
    } catch (error: any) {
        toast.error(handleApiError(error))
        yield put(fetchTopSellingItemsFailure(handleApiError(error)));
    }
}

export function* watchMenuSaga() {
    yield takeLatest(fetchMenuRequest.type, fetchMenuSaga);
    yield takeLatest(fetchCategoriesRequest.type, fetchCategoriesSaga);
    yield takeLatest(fetchFeaturedMenuRequest.type, fetchFeaturedMenuSaga);
    yield takeLatest(fetchTopSellingItemsRequest.type, fetchTopSellingItemsSaga);
}
