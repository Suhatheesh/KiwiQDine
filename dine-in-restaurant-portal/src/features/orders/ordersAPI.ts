import axiosClient from "../../api/axiosClient";
import { CancelOrderRequest, CreateOrder, FetchAllOrdersRequest, HoldOrderRequest, OrderItemResponse, OrderLog } from "./types";

const OrderAPI = {
    fetchAllOrders: (args: FetchAllOrdersRequest) => {
        const { isWaiterConfirmation, ...rest } = args;
        return axiosClient.get<OrderItemResponse[]>(`/api/orders`, { params: { ...rest } })
    },
    createOrder: (args: CreateOrder) => {
        const { tableId, restaurantType, ...rest } = args;
        return axiosClient.post<OrderItemResponse>('/api/order', rest)
    },
    updateOrder: (args: { orderId: string, orderItems: CreateOrder }) => {
        const { orderId, orderItems } = args;
        const { customerName, restaurantId, phone, tableId, orderType, restaurantType, tableNo, ...rest } = orderItems;
        return axiosClient.patch(`/api/orders/${orderId}`, rest)
    },
    fetchOrderById: (args: string) => axiosClient.get(`/api/orders/${args}`),
    fetchPendingOrdersByTableId: (tableId: string) => axiosClient.get(`/api/orders/tables/${tableId}/pending-orders`),
    confirmOrder: (args: string) => axiosClient.post(`/api/orders/${args}/confirm`),
    deleteOrder: (args: string) => axiosClient.delete(`/api/orders/${args}`),
    cancelOrder: (args: CancelOrderRequest) => {
        const { orderId, ...rest } = args;
        return axiosClient.post(`/api/order-status/order/${orderId}/cancel`, rest)
    },
    holdOrder: (args: HoldOrderRequest) => {
        const { orderId, ...rest } = args;
        return axiosClient.post(`/api/order-status/order/${orderId}/hold`, rest)
    },
    releaseOrder: (args: HoldOrderRequest) => {
        const { orderId, ...rest } = args;
        return axiosClient.post<OrderItemResponse>(`/api/order-status/order/${orderId}/release`, rest)
    },
    fetchOrderLogs: (orderId: string) => axiosClient.get<OrderLog[]>(`/api/order-management/${orderId}/logs`),
    fetchRecentLogs: (restaurantId: string) => axiosClient.get<OrderLog[]>(`/api/order-management/logs/recent`, { params: { restaurantId } }),
}

export default OrderAPI;