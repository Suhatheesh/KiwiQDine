import { call, CallEffect, put, PutEffect, putResolve, takeLatest } from "redux-saga/effects";
import { createMenuItemFaliure, createMenuItemRequest, createMenuItemSuccess, deleteMenuItemFaliure, deleteMenuItemRequest, deleteMenuItemSuccess, fetchMenuItemFaliure, fetchMenuItemLessWeightFaliure, fetchMenuItemLessWeightRequest, fetchMenuItemLessWeightSuccess, fetchMenuItemRequest, fetchMenuItemSuccess, menuItemAvailabilityFaliure, menuItemAvailabilityRequest, menuItemAvailabilitySuccess, updateMenuItemFaliure, updateMenuItemRequest, updateMenuItemSuccess, uploadMenuItemImageFaliure, uploadMenuItemImageRequest, uploadMenuItemImageSuccess } from "./menuItemSlice";
import { PayloadAction } from "@reduxjs/toolkit";
import { handleApiError } from "../../api/handleApiError";
import MenuItemAPI from "./menuItemAPI";
import { CreateMenuItemRequest, FetchAllMenuItemRequest, FetchAllMenuItemResponse, FetchMenuItemLessWeightResponse, FetchMenuItemRequest, MenuItem, UploadMenuItemImageResponse } from "./types";
import { fetchAllCategoryRequest } from "../category/categorySlice";
import { toast } from "react-toastify";
import { base64ToFile } from "../../utils";

function* fetchMenuItemSaga({ payload: args }: PayloadAction<FetchAllMenuItemRequest>): Generator<CallEffect | PutEffect, void, FetchAllMenuItemResponse> {
    try {
        const response = yield call(MenuItemAPI.fetchMenuItem, args);
        if (!args.search?.trim() && args.page === 1) {
            yield put(fetchAllCategoryRequest(args.restaurantId ?? ""));
        }
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
        yield putResolve(createMenuItemSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(createMenuItemFaliure(handleApiError(error)))
    }
}

function* updateMenuItemSaga({ payload: args }: PayloadAction<CreateMenuItemRequest>): Generator<CallEffect | PutEffect, void, any> {
    try {
        const response = yield call(MenuItemAPI.updateMenuItem, args);
        toast.success(`${args.name} item updated successfully!`)
        yield putResolve(updateMenuItemSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(updateMenuItemFaliure(handleApiError(error)))
    }
}

function* deleteMenuItemSaga({ payload: args }: PayloadAction<{ menuId: string, restaurantId: string }>): Generator<CallEffect | PutEffect, void, any> {
    try {
        yield call(MenuItemAPI.deleteMenuItem, args.menuId, args.restaurantId);
        toast.success(`${args.menuId} item deleted successfully!`)
        yield putResolve(deleteMenuItemSuccess(args.menuId))
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

export function* watchMenuItemSaga() {
    yield takeLatest(fetchMenuItemRequest.type, fetchMenuItemSaga);
    yield takeLatest(createMenuItemRequest.type, createMenuItemSaga);
    yield takeLatest(updateMenuItemRequest.type, updateMenuItemSaga);
    yield takeLatest(deleteMenuItemRequest.type, deleteMenuItemSaga);
    yield takeLatest(menuItemAvailabilityRequest.type, updateMenuItemAvailabilitySaga);
    yield takeLatest(uploadMenuItemImageRequest.type, uploadMenuItemImageSaga);
    yield takeLatest(fetchMenuItemLessWeightRequest.type, fetchMenuItemLessWeightSaga);
}