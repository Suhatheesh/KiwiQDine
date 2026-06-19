import axiosClient from "../../api/axiosClient"
import { OrderRequest, OrdersDashboardResponse, OrderSuccessResponse } from "./types"

const OrderAPI = {
    orderTotalCalculate: (args: OrderRequest) => axiosClient.post('/api/customer-portal/order/calculate-total', args),
    createOrder: (args: OrderRequest) => axiosClient.post('/api/customer-portal/order', args),
    updateRestaurantWallet: (args: { restaurantId: string; totalBalance: number }) => axiosClient.patch(`/api/customer-portal/restaurant/${args.restaurantId}/wallet`, { totalBalance: args.totalBalance }),
    fetchAllOrders: (phone: string, tenantId?: string) => axiosClient.get<OrdersDashboardResponse>(`/api/customer-portal/cart/orders/dashboard`, { params: { phone, tenantId } }),
    fetchOrderById: (orderId: string, phone: string) => axiosClient.get<OrderSuccessResponse>(`/api/customer-portal/order/${orderId}`, { params: { phone } }),
    fetchOrderByIdOnly: (orderId: string) => axiosClient.get<OrderSuccessResponse>(`/api/orders/${orderId}`),
    fetchAllRestaurantOrders: (phone: string, restaurantId?: string, activeOnly?: boolean) => axiosClient.get<OrderSuccessResponse[]>(`/api/customer-portal/orders`, { params: { phone, restaurantId, activeOnly } }),

    // Live tracking endpoint - Returns real-time order status with item-level details
    fetchLiveOrderTracking: (orderId: string, phone: string) => axiosClient.get<OrderSuccessResponse>(`/api/customer-portal/order/${orderId}/live-tracking`, { params: { phone } }),
}

export { OrderAPI }