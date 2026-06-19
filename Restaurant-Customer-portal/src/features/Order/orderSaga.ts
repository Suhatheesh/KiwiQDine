import { call, CallEffect, put, PutEffect, putResolve, takeLatest } from "redux-saga/effects";
import { OrderRequest, OrderResponse, OrdersDashboardResponse, OrderSuccessResponse } from "./types";
import { PayloadAction } from "@reduxjs/toolkit";
import { OrderAPI } from "./orderAPI";
import { calculateOrderTotalFailure, calculateOrderTotalRequest, calculateOrderTotalSuccess, createOrderFailure, createOrderRequest, createOrderSuccess, fetchAllOrdersFailure, fetchAllOrdersRequest, fetchAllOrdersSuccess, fetchAllRestaurantOrdersFailure, fetchAllRestaurantOrdersRequest, fetchAllRestaurantOrdersSuccess, fetchOrderByIdFailure, fetchOrderByIdRequest, fetchOrderByIdSuccess } from "./orderSlice";
import { handleApiError } from "../../api/handleApiError";
import { toast } from "react-toastify";

function* orderTotalCalculateSaga({ payload }: PayloadAction<OrderRequest>): Generator<CallEffect | PutEffect, void, OrderResponse> {
    try {
        const response = yield call(OrderAPI.orderTotalCalculate, payload);
        yield put(createOrderRequest(payload));
        yield putResolve(calculateOrderTotalSuccess(response));
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(calculateOrderTotalFailure(handleApiError(error)));
    }
}

function* createOrderSaga({ payload }: PayloadAction<OrderRequest>): Generator<CallEffect | PutEffect, void, OrderSuccessResponse> {
    try {
        const response = yield call(OrderAPI.createOrder, payload);
        toast.success("Order created successfully!")
        //yield put(processPaymentRequest({ orderId: response.id ?? "", paymentMethod: response.paymentMethod ?? "", amount: response.totalAmount, phone: payload.phone }))
        yield putResolve(createOrderSuccess(response));
    } catch (error) {
        const errorMsg = handleApiError(error);
        toast.error(errorMsg);
        yield put(createOrderFailure(errorMsg));
    }
}

function* fetchOrderByIdSaga({ payload }: PayloadAction<{ orderId: string, phone: string }>): Generator<CallEffect | PutEffect, void, OrderSuccessResponse> {
    try {
        const response = yield call(OrderAPI.fetchOrderById, payload.orderId, payload.phone);
        yield putResolve(fetchOrderByIdSuccess(response));
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(fetchOrderByIdFailure(handleApiError(error)));
    }
}

function* fetchAllOrdersSaga({ payload }: PayloadAction<{ phone: string, tenantId?: string }>): Generator<CallEffect | PutEffect, void, OrdersDashboardResponse> {
    try {
        const response = yield call(OrderAPI.fetchAllOrders, payload.phone, payload.tenantId);
        yield putResolve(fetchAllOrdersSuccess(response));
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(fetchAllOrdersFailure(handleApiError(error)));
    }
}

function* fetchAllRestaurantOrdersSaga({ payload }: PayloadAction<{ phone: string, restaurantId?: string, activeOnly?: boolean }>): Generator<CallEffect | PutEffect, void, { data: OrderSuccessResponse[] }> {
    try {
        const response = yield call(OrderAPI.fetchAllRestaurantOrders, payload.phone, payload.restaurantId, payload.activeOnly);
        yield putResolve(fetchAllRestaurantOrdersSuccess(response.data));
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(fetchAllRestaurantOrdersFailure(handleApiError(error)));
    }
}

export function* watchOrderSaga() {
    yield takeLatest(calculateOrderTotalRequest.type, orderTotalCalculateSaga)
    yield takeLatest(createOrderRequest.type, createOrderSaga)
    yield takeLatest(fetchOrderByIdRequest.type, fetchOrderByIdSaga)
    yield takeLatest(fetchAllOrdersRequest.type, fetchAllOrdersSaga)
    yield takeLatest(fetchAllRestaurantOrdersRequest.type, fetchAllRestaurantOrdersSaga)
}