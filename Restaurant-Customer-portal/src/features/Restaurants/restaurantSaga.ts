import { call, CallEffect, put, PutEffect, takeLatest } from "redux-saga/effects";
import RestaurantAPI from "./restaurantAPI";
import { RestaurantListResponse } from "./types";
import { fetchRestaurantsFailure, fetchRestaurantsRequest, fetchRestaurantsSuccess } from "./restaurantSlice";
import { handleApiError } from "../../api/handleApiError";
import { PayloadAction } from "@reduxjs/toolkit";
import { RestaurantType } from "../../utils/Constant";
import { MenuItem } from "../Menu/types";

type RestaurantListResponses = RestaurantListResponse | MenuItem[];

function* fetchRestaurantsSaga({ payload }: PayloadAction<{ restaurantId?: string, tenantId?: string, type: RestaurantType }>): Generator<CallEffect | PutEffect, void, RestaurantListResponses> {
    try {
        const response = yield call(RestaurantAPI.fetchRestaurants, payload.restaurantId, payload.tenantId);
        const restaurants = response as RestaurantListResponse;
        yield put(fetchRestaurantsSuccess(restaurants));
    } catch (error) {
        yield put(fetchRestaurantsFailure(handleApiError(error)));
    }
}

export function* watchRestaurantSaga() {
    yield takeLatest(fetchRestaurantsRequest.type, fetchRestaurantsSaga);
}
