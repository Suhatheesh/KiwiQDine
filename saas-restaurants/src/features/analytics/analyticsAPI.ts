import axiosClient from "../../api/axiosClient";
import { OrderByCategory, PaymentOverview, PeriodType, SalesOverview } from "./types";

const AnalyticsAPI = {
    fetchSalesOverview: (period: PeriodType = 'today', restaurantId: string) =>
        axiosClient.get<SalesOverview[]>(`/api/dashboard/sales-overview`, { params: { period, restaurantId } }),
    fetchOrderByCategory: (period: PeriodType = 'today', restaurantId: string) =>
        axiosClient.get<OrderByCategory[]>(`/api/dashboard/orders-by-category`, { params: { period, restaurantId } }),
    fetchPaymentOverview: (period: PeriodType = 'today', restaurantId: string) =>
        axiosClient.get<PaymentOverview[]>(`/api/dashboard/payment-methods`, { params: { period, restaurantId } }),
    fetchRestaurantAnalytics: (period: PeriodType = 'today', restaurantId: string) =>
        axiosClient.get(`/api/dashboard/restaurant-analytics`, { params: { period, restaurantId } }),

    /* Dashboard Analytics */
    fetchSummaryData: (period: PeriodType = 'today') =>
        axiosClient.get(`/api/dashboard/summary-data`, { params: { period } }),
    fetchSubscriptionRevenueTrends: (period: PeriodType = 'today') =>
        axiosClient.get(`/api/super-admin/dashboard/subscription-revenue-trends`, { params: { period } }),
    fetchPlatformGrowthTrends: (period: PeriodType = 'today') =>
        axiosClient.get(`/api/super-admin/dashboard/growth-trends`, { params: { period } }),
    fetchUserGrowthTrends: (period: PeriodType = 'today') =>
        axiosClient.get(`/api/super-admin/dashboard/user-growth`, { params: { period } }),
    fetchRevenueByPlan: (period: PeriodType = 'today') =>
        axiosClient.get(`/api/super-admin/dashboard/subscription-revenue`, { params: { period } }),
}

export default AnalyticsAPI
