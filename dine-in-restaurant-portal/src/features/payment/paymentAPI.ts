import axiosClient from "../../api/axiosClient";
import { OrderItemResponse } from "../orders/types";
import { EnableServiceChargeRequest, PaymentProcessRequest } from "./types";

const PaymentAPI = {
    paymentProcess: (args: PaymentProcessRequest) => {
        const { orderId, paymentTiming, restaurantId, ...rest } = args;
        return axiosClient.post<OrderItemResponse>(`/api/orders/${orderId}/process-payment`, rest)
    },
    enableServiceCharge: (args: EnableServiceChargeRequest) => {
        const { restaurantId, ...rest } = args;
        return axiosClient.patch(`/api/restaurants/${restaurantId}`, rest)
    }
}

export { PaymentAPI }