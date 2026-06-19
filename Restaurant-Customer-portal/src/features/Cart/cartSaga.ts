import { PayloadAction } from "@reduxjs/toolkit";
import { call, CallEffect, put, PutEffect, takeLatest } from "redux-saga/effects";
import { handleApiError } from "../../api/handleApiError";
import CartAPI from "./cartAPI";
import { fetchCartSuccess, fetchCartFailure, fetchCartRequest, addCartItemSuccess, addCartItemFailure, addCartItemRequest, deleteCartItemRequest, deleteCartItemFailure, deleteCartItemSuccess, updateCartItemSuccess, updateCartItemFailure, updateCartItemRequest, calculateItemsTotalSuccess, calculateItemsTotalFailure, calculateItemsTotalRequest, orderCheckoutFailure, orderCheckoutSuccess, orderCheckoutRequest } from "./cartSlice";
import { AddCartItemRequest, CalculateItemsTotalResponse, CartResponse, CheckoutSuccessResponse } from "./types";
import { OrderRequest } from "../Order/types";

function* fetchCartSaga(): Generator<CallEffect | PutEffect, void, CartResponse> {
    try {
        const response = yield call(CartAPI.fetchCart);
        yield put(fetchCartSuccess(response));
    } catch (error) {
        yield put(fetchCartFailure(handleApiError(error)));
    }
}

function* addCartItemSaga({ payload }: PayloadAction<AddCartItemRequest>): Generator<CallEffect | PutEffect, void, CartResponse> {
    try {
        const response = yield call(CartAPI.addCart, payload);
        yield put(addCartItemSuccess(response));
        yield put(fetchCartRequest());
    } catch (error) {
        yield put(addCartItemFailure(handleApiError(error)));
    }
}

function* updateCartItemSaga({ payload }: PayloadAction<AddCartItemRequest>): Generator<CallEffect | PutEffect, void, CartResponse> {
    try {
        const response = yield call(CartAPI.updateCart, payload);
        yield put(updateCartItemSuccess(response));
        yield put(fetchCartRequest());
    } catch (error) {
        yield put(updateCartItemFailure(handleApiError(error)));
    }
}

function* deleteCartItemSaga({ payload }: PayloadAction<{ menuId: string, selectedAddons?: { addonId: string, quantity: number }[] }>): Generator<CallEffect | PutEffect, void, CartResponse> {
    try {
        const response = yield call(CartAPI.deleteCart, payload.menuId, payload.selectedAddons);
        yield put(deleteCartItemSuccess(response));
        yield put(fetchCartRequest());
    } catch (error) {
        yield put(deleteCartItemFailure(handleApiError(error)));
    }
}

function* calculateItemsTotalSaga(): Generator<CallEffect | PutEffect, void, CalculateItemsTotalResponse> {
    try {
        const response = yield call(CartAPI.calculateItemsTotal);
        yield put(calculateItemsTotalSuccess(response));
    } catch (error) {
        yield put(calculateItemsTotalFailure(handleApiError(error)));
    }
}

function* orderCheckoutSaga({ payload }: PayloadAction<OrderRequest>): Generator<CallEffect | PutEffect, void, CheckoutSuccessResponse> {
    try {
        const response = yield call(CartAPI.orderCheckout, payload);
        console.log(response.totalAmount);

        yield put(orderCheckoutSuccess(response.orders));
    } catch (error) {
        yield put(orderCheckoutFailure(handleApiError(error)));
    }
}

export function* watchCartSaga() {
    yield takeLatest(fetchCartRequest.type, fetchCartSaga);
    yield takeLatest(addCartItemRequest.type, addCartItemSaga);
    yield takeLatest(updateCartItemRequest.type, updateCartItemSaga);
    yield takeLatest(deleteCartItemRequest.type, deleteCartItemSaga);
    yield takeLatest(calculateItemsTotalRequest.type, calculateItemsTotalSaga);
    yield takeLatest(orderCheckoutRequest.type, orderCheckoutSaga);
}
