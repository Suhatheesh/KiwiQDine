import axiosClient from "../../api/axiosClient";
import { FetchAllOrdersRequest, FetchAllOrdersResponse, OrderItemResponse } from "../orders/types";
import { OrderStatusUpdateRequest, UpdatePreparationTimeRequest } from "./types";

const KitchenAPI = {
    fetchAllOrders: (args: FetchAllOrdersRequest) => axiosClient.get<FetchAllOrdersResponse>(`/api/orders`, { params: args }),
    updateOrderStatus: (args: OrderStatusUpdateRequest) => axiosClient.post<OrderItemResponse>(`/api/order-status`, args),
    orderItemStart: (orderItemId: string) => axiosClient.post(`/api/kitchen-display/order-item/${orderItemId}/start`),
    orderItemReady: (orderItemId: string) => axiosClient.post(`/api/kitchen-display/order-item/${orderItemId}/ready`),
    orderItemServed: (args: OrderStatusUpdateRequest) => {
        const { orderId, ...rest } = args;
        return axiosClient.patch(`/api/order-status/order-item/${orderId}/status`, rest)
    },
    orderReady: (orderId: string) => axiosClient.post<OrderItemResponse>(`/api/order-status/order/${orderId}/mark-ready`),
    orderCompleted: (orderId: string) => axiosClient.post<OrderItemResponse>(`/api/order-status/order/${orderId}/mark-completed`),
    updateItemPreparationTime: (args: UpdatePreparationTimeRequest) => {
        const { orderItemId, ...rest } = args;
        return axiosClient.patch(`/api/order-status/order-item/${orderItemId}/status`, rest)
    }
}

export default KitchenAPI;