import axiosClient from "../../api/axiosClient"
import { PaymentOverview, PeriodType, SummaryCards, TableOverview } from "./types"
import { SalesOverview } from "./types"
import { OrderByCategory } from "./types"

const DashboardAPI = {
    fetchSummaryCards: (period: PeriodType = 'today') =>
        axiosClient.get<SummaryCards>(`/api/dashboard/summary?salesPeriod=${period}`),

    fetchSalesOverview: (period: PeriodType = 'today') =>
        axiosClient.get<SalesOverview[]>(`/api/dashboard/sales-overview?period=${period}`),

    fetchOrderByCategory: (period: PeriodType = 'today') =>
        axiosClient.get<OrderByCategory[]>(`/api/dashboard/orders-by-category?period=${period}`),

    fetchPaymentOverview: (period: PeriodType = 'today') =>
        axiosClient.get<PaymentOverview[]>(`/api/dashboard/payment-methods?period=${period}`),

    fetchTableOverview: (period: PeriodType = 'today') =>
        axiosClient.get<TableOverview[]>(`/api/dashboard/table-occupancy?period=${period}`),

    fetchRecentOrders: (limit: number = 10) =>
        axiosClient.get(`/api/dashboard/recent-orders?limit=${limit}`),

    fetchTopfoods: (period: PeriodType = 'today') => axiosClient.get('/api/dashboard/top-10-foods', { params: { period } })
}

export default DashboardAPI