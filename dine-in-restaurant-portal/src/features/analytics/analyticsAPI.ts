import axiosClient from "../../api/axiosClient";

import { AnalyticsFilters } from "./types";

const AnalyticsAPI = {
    fetchAnalyticsData: (filters?: AnalyticsFilters) => {
        const params = new URLSearchParams();
        if (filters) {
            if (filters.period) params.append('period', filters.period);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
        }
        const query = params.toString();
        return axiosClient.get(`/api/dashboard/restaurant-analytics${query ? `?${query}` : ''}`);
    },
    orderAnalytics: (restaurantId: string, filters?: AnalyticsFilters) => axiosClient.get(`/api/orders/analytics/summary`, { params: { restaurantId, startDate: filters?.startDate, endDate: filters?.endDate } }),
    kotAnalytics: (restaurantId: string, filters?: AnalyticsFilters) => axiosClient.get(`/api/orders/kot/summary`, { params: { restaurantId, startDate: filters?.startDate, endDate: filters?.endDate } }),
}

export default AnalyticsAPI
