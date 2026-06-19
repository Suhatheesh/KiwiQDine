import { call, CallEffect, put, PutEffect, putResolve, takeLatest } from "redux-saga/effects";
import { cancelOrderFaliure, cancelOrderRequest, cancelOrderSuccess, confirmOrderFaliure, confirmOrderRequest, confirmOrderSuccess, createAndHoldOrderRequest, createOrderFaliure, createOrderRequest, createOrderSuccess, deleteOrderFaliure, deleteOrderRequest, deleteOrderSuccess, fetchAllOrdersFaliure, fetchAllOrdersRequest, fetchAllOrdersSuccess, fetchOrderLogsFailure, fetchOrderLogsRequest, fetchOrderLogsSuccess, fetchOrdersByIdFaliure, fetchOrdersByIdRequest, fetchOrdersByIdSuccess, fetchPendingOrdersByTableIdFaliure, fetchPendingOrdersByTableIdRequest, fetchPendingOrdersByTableIdSuccess, fetchRecentLogsFailure, fetchRecentLogsRequest, fetchRecentLogsSuccess, holdOrderFaliure, holdOrderRequest, holdOrderSuccess, releaseOrderRequest, updateOrderFaliure, updateOrderRequest, updateOrderSuccess } from "./ordersSlice";
import { handleApiError } from "../../api/handleApiError";
import OrderAPI from "./ordersAPI";
import { PayloadAction } from "@reduxjs/toolkit";
import { CancelOrderRequest, CreateAndHoldOrderRequest, CreateOrder, FetchAllOrdersRequest, FetchAllOrdersResponse, HoldOrderRequest, OrderItemResponse } from "./types";
import { toast } from "react-toastify";
import { OrderStatus, OrderType, TableStatus, TenantType } from "../../utils/constants";
import { UpdateTableStatusRequest } from "../tables/types";
import { updateTableStatusRequest } from "../tables/tablesSlice";
import { fetchSubscriptionUsageRequest } from "../subscriptions/subscriptionsSlice";

function* fetchAllOrdersSaga({ payload: args }: PayloadAction<FetchAllOrdersRequest>): Generator<CallEffect | PutEffect, void, FetchAllOrdersResponse> {
    try {
        const response = yield call(OrderAPI.fetchAllOrders, args);
        yield putResolve(fetchAllOrdersSuccess({ type: args.isWaiterConfirmation ? OrderStatus.PENDING : args.paymentStatus, payload: response }))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(fetchAllOrdersFaliure(handleApiError(error)))
    }
}

function* fetchPendingOrdersByTableIdSaga({ payload: args }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, OrderItemResponse[]> {
    try {
        const response = yield call(OrderAPI.fetchPendingOrdersByTableId, args);
        yield putResolve(fetchPendingOrdersByTableIdSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(fetchPendingOrdersByTableIdFaliure(handleApiError(error)))
    }
}

function* createOrdersSaga({ payload: args }: PayloadAction<CreateOrder>): Generator<CallEffect | PutEffect, void, OrderItemResponse> {
    try {
        const response = yield call(OrderAPI.createOrder, args);
        toast.success("Order created successfully!")
        if (args.orderType === OrderType.DINEIN && args.restaurantType === TenantType.RESTAURANT) {
            const tableRequest: UpdateTableStatusRequest = {
                tableId: args.tableId ?? "",
                status: TableStatus.OCCUPIED,
                restaurantId: args.restaurantId ?? ""
            }
            yield put(updateTableStatusRequest(tableRequest));
        }
        if (args.restaurantId) {
            yield put(fetchSubscriptionUsageRequest(args.restaurantId));
        }
        yield putResolve(createOrderSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(createOrderFaliure(handleApiError(error)))
    }
}

function* updateOrdersSaga({ payload: args }: PayloadAction<{ confirm?: boolean, orderId: string, orderItems: CreateOrder }>): Generator<CallEffect | PutEffect, void, OrderItemResponse> {
    try {
        const response = yield call(OrderAPI.updateOrder, args);
        toast.success("Order updated successfully!")
        if (args.confirm) {
            yield put(confirmOrderRequest(args.orderId))
        } else {
            yield put(releaseOrderRequest({ orderId: args.orderId }))
        }
        yield putResolve(updateOrderSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(updateOrderFaliure(handleApiError(error)))
    }
}

function* fetchOrdersByIdSaga({ payload: args }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, OrderItemResponse> {
    try {
        const response = yield call(OrderAPI.fetchOrderById, args);
        yield putResolve(fetchOrdersByIdSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(fetchOrdersByIdFaliure(handleApiError(error)))
    }
}

function* confirmOrdersSaga({ payload: args }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, OrderItemResponse> {
    try {
        const response = yield call(OrderAPI.confirmOrder, args);
        toast.success("Order confirm successfully!")
        yield putResolve(confirmOrderSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(confirmOrderFaliure(handleApiError(error)))
    }
}

function* deleteOrdersSaga({ payload: args }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, string> {
    try {
        yield call(OrderAPI.deleteOrder, args);
        toast.success("Order delete successfully!")
        yield putResolve(deleteOrderSuccess(args))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(deleteOrderFaliure(handleApiError(error)))
    }
}

function* cancelOrdersSaga({ payload: args }: PayloadAction<CancelOrderRequest>): Generator<CallEffect | PutEffect, void, OrderItemResponse> {
    try {
        const response = yield call(OrderAPI.cancelOrder, args);
        toast.success("Order cancel successfully!")
        yield putResolve(cancelOrderSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(cancelOrderFaliure(handleApiError(error)))
    }
}

function* holdOrdersSaga({ payload: args }: PayloadAction<HoldOrderRequest>): Generator<CallEffect | PutEffect, void, OrderItemResponse> {
    try {
        const response = yield call(OrderAPI.holdOrder, args);
        toast.success("Order held successfully!")
        yield putResolve(holdOrderSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(holdOrderFaliure(handleApiError(error)))
    }
}

function* createAndHoldOrdersSaga({ payload: args }: PayloadAction<CreateAndHoldOrderRequest>): Generator<CallEffect | PutEffect, void, OrderItemResponse> {
    try {
        const { reason, restaurantType, updatedBy, ...createOrderArgs } = args;
        const createResponse = yield call(OrderAPI.createOrder, createOrderArgs);

        const holdArgs: HoldOrderRequest = {
            orderId: createResponse.id,
            reason,
            updatedBy
        };
        const holdResponse = yield call(OrderAPI.holdOrder, holdArgs);

        toast.success("Order created and held successfully!")

        yield putResolve(createOrderSuccess(createResponse))
        yield putResolve(holdOrderSuccess(holdResponse))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(createOrderFaliure(handleApiError(error)))
    }
}

function* releaseOrdersSaga({ payload: args }: PayloadAction<HoldOrderRequest>): Generator<CallEffect | PutEffect, void, OrderItemResponse> {
    try {
        const response = yield call(OrderAPI.releaseOrder, args);
        toast.success("Order released successfully!")
        yield putResolve(holdOrderSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(holdOrderFaliure(handleApiError(error)))
    }
}

function* fetchOrderLogsSaga({ payload: orderId }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, any[]> {
    try {
        const response = yield call(OrderAPI.fetchOrderLogs, orderId);
        yield put(fetchOrderLogsSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(fetchOrderLogsFailure(handleApiError(error)))
    }
}

function* fetchRecentLogsSaga({ payload: restaurantId }: PayloadAction<string>): Generator<CallEffect | PutEffect, void, any[]> {
    try {
        const response = yield call(OrderAPI.fetchRecentLogs, restaurantId);
        yield put(fetchRecentLogsSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(fetchRecentLogsFailure(handleApiError(error)))
    }
}

export function* watchOrdersSaga() {
    yield takeLatest(fetchAllOrdersRequest.type, fetchAllOrdersSaga)
    yield takeLatest(fetchPendingOrdersByTableIdRequest.type, fetchPendingOrdersByTableIdSaga)
    yield takeLatest(createOrderRequest.type, createOrdersSaga)
    yield takeLatest(updateOrderRequest.type, updateOrdersSaga)
    yield takeLatest(fetchOrdersByIdRequest.type, fetchOrdersByIdSaga)
    yield takeLatest(confirmOrderRequest.type, confirmOrdersSaga)
    yield takeLatest(deleteOrderRequest.type, deleteOrdersSaga)
    yield takeLatest(cancelOrderRequest.type, cancelOrdersSaga)
    yield takeLatest(holdOrderRequest.type, holdOrdersSaga)
    yield takeLatest(createAndHoldOrderRequest.type, createAndHoldOrdersSaga)
    yield takeLatest(releaseOrderRequest.type, releaseOrdersSaga)
    yield takeLatest(fetchOrderLogsRequest.type, fetchOrderLogsSaga)
    yield takeLatest(fetchRecentLogsRequest.type, fetchRecentLogsSaga)
}