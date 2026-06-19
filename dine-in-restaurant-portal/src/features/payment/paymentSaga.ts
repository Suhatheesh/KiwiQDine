import { PayloadAction } from "@reduxjs/toolkit";
import { EnableServiceChargeRequest, PaymentProcessRequest } from "./types";
import { toast } from "react-toastify";
import { CallEffect, PutEffect, call, putResolve, put, takeLatest } from "redux-saga/effects";
import { handleApiError } from "../../api/handleApiError";
import { PaymentAPI } from "./paymentAPI";
import { processPaymentFaliure, processPaymentRequest, processPaymentSuccess } from "./paymentSlice";
import { OrderItemResponse } from "../orders/types";
import { confirmOrderRequest } from "../orders/ordersSlice";
import { PaymentTiming } from "../../utils/constants";
import { enableServiceChargeFaliure, enableServiceChargeRequest, enableServiceChargeSuccess } from "./paymentSlice";
import { fetchSubscriptionUsageRequest } from "../subscriptions/subscriptionsSlice";

function* ProcessPaymentSaga({ payload: args }: PayloadAction<PaymentProcessRequest>): Generator<CallEffect | PutEffect, void, OrderItemResponse> {
    try {
        const response = yield call(PaymentAPI.paymentProcess, args);
        toast.success("Payment successfully!")
        yield putResolve(processPaymentSuccess(response))
        yield put(fetchSubscriptionUsageRequest(args.restaurantId))
        if (args.paymentTiming === PaymentTiming.PAY_AT_FIRST) {
            yield put(confirmOrderRequest(args.orderId))
        }
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(processPaymentFaliure(handleApiError(error)))
    }
}

function* EnableServiceChargeSaga({ payload: args }: PayloadAction<EnableServiceChargeRequest>): Generator<CallEffect | PutEffect, void, OrderItemResponse> {
    try {
        const response = yield call(PaymentAPI.enableServiceCharge, args);
        toast.success("Service charge enabled successfully!")
        yield putResolve(enableServiceChargeSuccess(response))
    } catch (error) {
        toast.error(handleApiError(error))
        yield put(enableServiceChargeFaliure(handleApiError(error)))
    }
}

export function* watchPaymentsSaga() {
    yield takeLatest(processPaymentRequest.type, ProcessPaymentSaga)
    yield takeLatest(enableServiceChargeRequest.type, EnableServiceChargeSaga)
}