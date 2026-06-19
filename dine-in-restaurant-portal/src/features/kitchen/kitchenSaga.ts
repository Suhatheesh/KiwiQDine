import { PayloadAction } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import { CallEffect, PutEffect, call, putResolve, put, takeLatest } from "redux-saga/effects";
import { handleApiError } from "../../api/handleApiError";
import { fetchAllKitchenOrdersSuccess, fetchAllKitchenOrdersFaliure, fetchAllKitchenOrdersRequest, updateOrderStatusFaliure, updateOrderStatusRequest, updateOrderStatusSuccess, readyOrderItemStatusRequest, startOrderItemStatusRequest, updateOrderItemStatusFaliure, updateOrderItemStatusSuccess, readyOrderStatusRequest, servedOrderItemStatusRequest, orderCompletedRequest, updatePreparationTimeRequest, updatePreparationTimeSuccess, updatePreparationTimeFailure } from "./kitchenSlice";
import { OrderStatusUpdateRequest, UpdatePreparationTimeRequest } from "./types";
import KitchenAPI from "./kitchenAPI";
import { FetchAllOrdersRequest, FetchAllOrdersResponse, OrderItemResponse } from "../orders/types";

function* fetchAllKitchenOrderSaga({ payload: args }: PayloadAction<FetchAllOrdersRequest>): Generator<CallEffect | PutEffect, void, FetchAllOrdersResponse> {
    try {
        const response = yield call(KitchenAPI.fetchAllOrders, args);
        yield putResolve(fetchAllKitchenOrdersSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(fetchAllKitchenOrdersFaliure(handleApiError(error)))
    }
}

function* updateOrderStatusSaga({ payload: args }: PayloadAction<OrderStatusUpdateRequest>): Generator<CallEffect | PutEffect, void, { orderId: string, status: string }> {
    try {
        const response = yield call(KitchenAPI.updateOrderStatus, args);
        yield putResolve(updateOrderStatusSuccess({ orderId: response.orderId, status: response.status }))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(updateOrderStatusFaliure(handleApiError(error)))
    }
}

function* orderItemStartSaga({ payload: args }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, OrderItemResponse> {
    try {
        const response = yield call(KitchenAPI.orderItemStart, args);
        yield putResolve(updateOrderItemStatusSuccess({ orderId: response.orderId!, itemId: response.id!, status: response.status!, startedAt: response.startedAt! }))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(updateOrderItemStatusFaliure(handleApiError(error)))
    }
}

function* orderItemReadySaga({ payload: args }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, OrderItemResponse> {
    try {
        const response = yield call(KitchenAPI.orderItemReady, args);
        yield putResolve(updateOrderItemStatusSuccess({ orderId: response.orderId!, itemId: response.id!, status: response.status! }))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(updateOrderItemStatusFaliure(handleApiError(error)))
    }
}

function* orderReadySaga({ payload: args }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, OrderItemResponse> {
    try {
        const response = yield call(KitchenAPI.orderReady, args);
        yield putResolve(updateOrderStatusSuccess({ orderId: response.id!, status: response.status! }))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(updateOrderStatusSuccess(handleApiError(error)))
    }
}

function* orderServeddSaga({ payload: args }: PayloadAction<OrderStatusUpdateRequest>): Generator<CallEffect | PutEffect, void, OrderItemResponse> {
    try {
        const response = yield call(KitchenAPI.orderItemServed, args);
        yield putResolve(updateOrderStatusSuccess({ orderId: response.id!, status: response.status! }))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(updateOrderStatusSuccess(handleApiError(error)))
    }
}

function* orderCompletedSaga({ payload: args }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, OrderItemResponse> {
    try {
        const response = yield call(KitchenAPI.orderCompleted, args);
        yield putResolve(updateOrderStatusSuccess({ orderId: response.id!, status: response.status! }))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(updateOrderStatusSuccess(handleApiError(error)))
    }
}

function* updatePreparationTimeSaga({ payload: args }: PayloadAction<UpdatePreparationTimeRequest>): Generator<CallEffect | PutEffect, void, OrderItemResponse> {
    try {
        const response = yield call(KitchenAPI.updateItemPreparationTime, args);
        yield putResolve(updatePreparationTimeSuccess({
            orderId: response.orderId!,
            itemId: response.id!,
            preparationTime: args.additionalPreparationTime
        }))
        toast.success("Preparation time updated successfully")
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(updatePreparationTimeFailure(handleApiError(error)))
    }
}

export function* watchKitchenOrdersSaga() {
    yield takeLatest(fetchAllKitchenOrdersRequest.type, fetchAllKitchenOrderSaga)
    yield takeLatest(updateOrderStatusRequest.type, updateOrderStatusSaga)
    yield takeLatest(startOrderItemStatusRequest.type, orderItemStartSaga)
    yield takeLatest(readyOrderItemStatusRequest.type, orderItemReadySaga)
    yield takeLatest(readyOrderStatusRequest.type, orderReadySaga)
    yield takeLatest(servedOrderItemStatusRequest.type, orderServeddSaga)
    yield takeLatest(orderCompletedRequest.type, orderCompletedSaga)
    yield takeLatest(updatePreparationTimeRequest.type, updatePreparationTimeSaga)
}