import { call, CallEffect, put, PutEffect, putResolve, takeLatest } from "redux-saga/effects";
import { attachBadgesFaliure, attachBadgesRequest, attachBadgesSuccess, createMenuItemFaliure, createMenuItemRequest, createMenuItemSuccess, deleteMenuItemFaliure, deleteMenuItemRequest, deleteMenuItemSuccess, fetchBadgesFaliure, fetchBadgesRequest, fetchBadgesSuccess, fetchMenuItemFaliure, fetchMenuItemLessWeightFaliure, fetchMenuItemLessWeightRequest, fetchMenuItemLessWeightSuccess, fetchMenuItemRequest, fetchMenuItemSuccess, fetchTopFeaturedItemsFaliure, fetchTopFeaturedItemsRequest, fetchTopFeaturedItemsSuccess, fetchTopSellingItemsFaliure, fetchTopSellingItemsRequest, fetchTopSellingItemsSuccess, menuItemAvailabilityFaliure, menuItemAvailabilityRequest, menuItemAvailabilitySuccess, updateMenuItemFaliure, updateMenuItemRequest, updateMenuItemSuccess, uploadMenuItemImageFaliure, uploadMenuItemImageRequest, uploadMenuItemImageSuccess } from "./menuItemSlice";
import { PayloadAction } from "@reduxjs/toolkit";
import { handleApiError } from "../../api/handleApiError";
import MenuItemAPI from "./menuItemAPI";
import { Badge, CreateMenuItemRequest, FetchAllMenuItemResponse, FetchMenuItemLessWeightResponse, FetchMenuItemRequest, MenuItem, UploadMenuItemImageResponse } from "./types";
import { toast } from "react-toastify";
import { base64ToFile } from "../../utils";
import { fetchAllCategoryRequest } from "../category/categorySlice";

function* fetchMenuItemSaga({ payload: args }: PayloadAction<FetchMenuItemRequest>): Generator<CallEffect | PutEffect, void, FetchAllMenuItemResponse> {
    try {
        const response = yield call(MenuItemAPI.fetchMenuItem, args);
        yield putResolve(fetchMenuItemSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(fetchMenuItemFaliure(handleApiError(error)))
    }
}

function* fetchMenuItemLessWeightSaga({ payload: args }: PayloadAction<FetchMenuItemRequest>): Generator<CallEffect | PutEffect, void, FetchMenuItemLessWeightResponse[]> {
    try {
        const response = yield call(MenuItemAPI.fetchMenuItemLessWeight, args);
        yield putResolve(fetchMenuItemLessWeightSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(fetchMenuItemLessWeightFaliure(handleApiError(error)))
    }
}

function* createMenuItemSaga({ payload: args }: PayloadAction<CreateMenuItemRequest>): Generator<CallEffect | PutEffect, void, MenuItem> {
    try {
        const response = yield call(MenuItemAPI.createMenuItem, args);
        toast.success(`${args.name} item added successfully!`)
        yield put(attachBadgesRequest({ menuId: response.id!, badges: args.badges as string[] ?? [], isFeatured: args.isFeatured || false, featuredOrder: args.featuredOrder || 0 }));
        yield putResolve(createMenuItemSuccess(response))
        yield putResolve(fetchAllCategoryRequest())
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(createMenuItemFaliure(handleApiError(error)))
    }
}

function* updateMenuItemSaga({ payload: args }: PayloadAction<CreateMenuItemRequest>): Generator<CallEffect | PutEffect, void, any> {
    try {
        const response = yield call(MenuItemAPI.updateMenuItem, args);
        toast.success(`${args.name} item updated successfully!`)
        yield put(attachBadgesRequest({ menuId: response.id!, badges: args.badges as string[] ?? [], isFeatured: args.isFeatured || false, featuredOrder: args.featuredOrder || 0 }));
        yield putResolve(updateMenuItemSuccess(response))
        yield putResolve(fetchAllCategoryRequest())
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(updateMenuItemFaliure(handleApiError(error)))
    }
}

function* deleteMenuItemSaga({ payload: args }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, any> {
    try {
        yield call(MenuItemAPI.deleteMenuItem, args);
        toast.success(`${args} item deleted successfully!`)
        yield putResolve(deleteMenuItemSuccess(args))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(deleteMenuItemFaliure(handleApiError(error)))
    }
}

function* updateMenuItemAvailabilitySaga({ payload: args }: PayloadAction<{ menuId: string, restaurantId: string, value: boolean }>): Generator<CallEffect | PutEffect, void, MenuItem> {
    try {
        const response = yield call(MenuItemAPI.updateAvailabity, args);
        toast.success(`${response.name} item status updated!`)
        yield putResolve(menuItemAvailabilitySuccess(response))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(menuItemAvailabilityFaliure(handleApiError(error)))
    }
}

function* uploadMenuItemImageSaga({ payload: args }: PayloadAction<{ restaurantId: string, image: string }>): Generator<CallEffect | PutEffect, void, UploadMenuItemImageResponse> {
    try {
        const file = base64ToFile(args.image, "image.jpg");
        const response = yield call(MenuItemAPI.uploadImage, args.restaurantId, file);
        yield putResolve(uploadMenuItemImageSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(uploadMenuItemImageFaliure(handleApiError(error)))
    }
}

function* fetchBadgesSaga(): Generator<CallEffect | PutEffect, void, Badge[]> {
    try {
        const response = yield call(MenuItemAPI.fetchBadges);
        yield putResolve(fetchBadgesSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(fetchBadgesFaliure(handleApiError(error)))
    }
}

function* attachBadgesSaga({ payload: args }: PayloadAction<{ menuId: string, isFeatured: boolean, featuredOrder: number, badges: string[] }>): Generator<CallEffect | PutEffect, void, MenuItem> {
    try {
        const response = yield call(MenuItemAPI.attachBadges, args);
        toast.success(`${response.name} item badges updated successfully!`)
        yield putResolve(attachBadgesSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(attachBadgesFaliure(handleApiError(error)))
    }
}

function* fetchTopSellingItemsSaga({ payload: restaurantId }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, MenuItem[]> {
    try {
        const response = yield call(MenuItemAPI.fetchTopSellingItems, { restaurantId });
        yield putResolve(fetchTopSellingItemsSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(fetchTopSellingItemsFaliure(handleApiError(error)))
    }
}

function* fetchTopFeaturedItemsSaga({ payload: restaurantId }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, MenuItem[]> {
    try {
        const response = yield call(MenuItemAPI.fetchTopFeaturedItems, { restaurantId });
        yield putResolve(fetchTopFeaturedItemsSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(fetchTopFeaturedItemsFaliure(handleApiError(error)))
    }
}

export function* watchMenuItemSaga() {
    yield takeLatest(fetchMenuItemRequest.type, fetchMenuItemSaga);
    yield takeLatest(fetchMenuItemLessWeightRequest.type, fetchMenuItemLessWeightSaga);
    yield takeLatest(createMenuItemRequest.type, createMenuItemSaga);
    yield takeLatest(updateMenuItemRequest.type, updateMenuItemSaga);
    yield takeLatest(deleteMenuItemRequest.type, deleteMenuItemSaga);
    yield takeLatest(menuItemAvailabilityRequest.type, updateMenuItemAvailabilitySaga);
    yield takeLatest(uploadMenuItemImageRequest.type, uploadMenuItemImageSaga);
    yield takeLatest(fetchBadgesRequest.type, fetchBadgesSaga);
    yield takeLatest(attachBadgesRequest.type, attachBadgesSaga);
    yield takeLatest(fetchTopSellingItemsRequest.type, fetchTopSellingItemsSaga);
    yield takeLatest(fetchTopFeaturedItemsRequest.type, fetchTopFeaturedItemsSaga);
}