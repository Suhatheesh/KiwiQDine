import { call, CallEffect, put, PutEffect, putResolve, takeLatest } from "redux-saga/effects";
import { CategoryRequest, CategoryResponse } from "./types";
import { createCategoryFaliure, createCategoryRequest, createCategorySuccess, deleteCategoryFaliure, deleteCategoryRequest, deleteCategorySuccess, fetchAllCategoryFaliure, fetchAllCategoryRequest, fetchAllCategorySuccess, updateCategoryFaliure, updateCategoryRequest, updateCategorySuccess, uploadCategoryImageFaliure, uploadCategoryImageRequest, uploadCategoryImageSuccess } from "./categorySlice";
import { PayloadAction } from "@reduxjs/toolkit";
import { handleApiError } from "../../api/handleApiError";
import CategoryAPI from "./categoryAPI";
import { toast } from "react-toastify";
import { base64ToFile } from "../../utils";
import { UploadMenuItemImageResponse } from "../menuItems/types";

function* fetchAllCategorySaga({ payload: args }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, CategoryResponse> {
    try {
        const response = yield call(CategoryAPI.fetchAllCategory, args);
        if (Array.isArray(response.data)) {
            yield putResolve(fetchAllCategorySuccess(response.data));
        }
    } catch (error) {
        yield put(fetchAllCategoryFaliure(handleApiError(error)))
    }
}

function* createCategorySaga({ payload: args }: PayloadAction<CategoryRequest>): Generator<CallEffect | PutEffect, void, CategoryResponse> {
    try {
        const response = yield call(CategoryAPI.createCategory, args);
        if (!Array.isArray(response.data)) {
            yield putResolve(createCategorySuccess(response.data));
        }
        toast.success("Category created successfully");
    } catch (error) {
        yield put(createCategoryFaliure(handleApiError(error)))
    }
}

function* updateCategorySaga({ payload: args }: PayloadAction<CategoryRequest>): Generator<CallEffect | PutEffect, void, CategoryResponse> {
    try {
        const response = yield call(CategoryAPI.updateCategory, args);
        if (!Array.isArray(response.data)) {
            toast.success(`Category updated successfully!`)
            yield putResolve(updateCategorySuccess(response.data));
        }
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(updateCategoryFaliure(handleApiError(error)))
    }
}

function* deleteCategorySaga({ payload: args }: PayloadAction<{ ids: string[], restaurantId: string }>): Generator<CallEffect | PutEffect, void, any> {
    try {
        yield call(CategoryAPI.deleteCategory, args.ids, args.restaurantId);
        yield putResolve(deleteCategorySuccess(args.ids));
        toast.success("Category deleted successfully");
    } catch (error) {
        yield put(deleteCategoryFaliure(handleApiError(error)))
    }
}

function* uploadCategoryImageSaga({ payload: args }: PayloadAction<{ restaurantId: string, image: string }>): Generator<CallEffect | PutEffect, void, UploadMenuItemImageResponse> {
    try {
        const file = base64ToFile(args.image, "image.jpg");
        const response = yield call(CategoryAPI.uploadImage, args.restaurantId, file);
        yield putResolve(uploadCategoryImageSuccess(response));
    } catch (error) {
        toast.error(handleApiError(error));
        yield put(uploadCategoryImageFaliure(handleApiError(error)))
    }
}

export function* watchCategorySaga() {
    yield takeLatest(fetchAllCategoryRequest.type, fetchAllCategorySaga);
    yield takeLatest(createCategoryRequest.type, createCategorySaga);
    yield takeLatest(updateCategoryRequest.type, updateCategorySaga);
    yield takeLatest(deleteCategoryRequest.type, deleteCategorySaga);
    yield takeLatest(uploadCategoryImageRequest.type, uploadCategoryImageSaga);
}