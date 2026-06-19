import axiosClient from "./axiosClient";

export type PeriodType = 'today' | 'week' | 'month' | 'year';
export type GranularityType = 'daily' | 'weekly' | 'monthly';

// Summary Cards Response
export interface SummaryCardsResponse {
    period: string;
    dateRange: {
        startDate: string;
        endDate: string;
    };
    cards: {
        subscriptionRevenue: {
            value: number;
            previousValue: number;
            growth: number;
            trend: string;
            label: string;
            description: string;
            icon: string;
            type: string;
        };
        activeTenants: {
            value: number;
            previousValue: number;
            growth: number;
            trend: string;
            label: string;
            description: string;
            icon: string;
            type: string;
        };
        activeRestaurants: {
            value: number;
            previousValue: number;
            growth: number;
            trend: string;
            label: string;
            description: string;
            icon: string;
            type: string;
        };
        totalUsers: {
            value: number;
            previousValue: number;
            growth: number;
            trend: string;
            label: string;
            description: string;
            icon: string;
            type: string;
        };
    };
}

// Growth Trends Response
export interface GrowthDataPoint {
    period: string;
    revenue: number;
    orders: number;
    newCustomers: number;
    newUsers: number;
}

export interface GrowthTrendsResponse {
    period: string;
    granularity: string;
    dateRange: {
        startDate: string;
        endDate: string;
    };
    trends: GrowthDataPoint[];
    summary: {
        totalRevenue: number;
        totalOrders: number;
        totalNewCustomers: number;
        totalNewUsers: number;
    };
}

// Restaurant Performance Response
export interface Restaurant {
    restaurantId: string;
    restaurantName: string;
    logo?: string;
    revenue: number;
    previousRevenue: number;
    revenueGrowth: number;
    orders: number;
    previousOrders: number;
    orderGrowth: number;
    avgOrderValue: number;
    avgPrepTime: number;
    activeCustomers: number;
}

export interface RestaurantsPerformanceResponse {
    period: string;
    dateRange: {
        startDate: string;
        endDate: string;
    };
    restaurants: Restaurant[];
    summary: {
        totalRestaurants: number;
        totalRevenue: number;
        totalOrders: number;
        avgRevenuePerRestaurant: number;
    };
}

// Subscription Revenue Response
export interface SubscriptionDataPoint {
    period: string;
    revenue: number;
    subscriptions: number;
    monthly: number;
    yearly: number;
    planBreakdown: Array<{
        planName: string;
        subscriptions: number;
        revenue: number;
    }>;
}

export interface SubscriptionRevenueResponse {
    period: string;
    granularity: string;
    dateRange: {
        startDate: string;
        endDate: string;
    };
    trends: SubscriptionDataPoint[];
    summary: {
        totalRevenue: number;
        totalSubscriptions: number;
        avgRevenuePerPeriod: number;
        avgSubscriptionsPerPeriod: number;
    };
}

// Restaurant Status Response
export interface RestaurantStatusResponse {
    active: number;
    inactive: number;
    suspended: number;
    total: number;
}

class SuperAdminAPI {
    private readonly BASE_PATH = '/api/super-admin/dashboard';

    async getSummaryCards(period: PeriodType = 'month'): Promise<SummaryCardsResponse> {
        // axiosClient response interceptor returns response.data directly
        return axiosClient.get<SummaryCardsResponse>(`${this.BASE_PATH}/summary-cards`, {
            params: { period },
        }) as unknown as Promise<SummaryCardsResponse>;
    }

    async getGrowthTrends(
        period: PeriodType | 'quarter' = 'month',
        granularity: GranularityType = 'daily'
    ): Promise<GrowthTrendsResponse> {
        return axiosClient.get<GrowthTrendsResponse>(`${this.BASE_PATH}/growth-trends`, {
            params: { period, granularity },
        }) as unknown as Promise<GrowthTrendsResponse>;
    }

    async getRestaurantsPerformance(period: PeriodType = 'month'): Promise<RestaurantsPerformanceResponse> {
        return axiosClient.get<RestaurantsPerformanceResponse>(`${this.BASE_PATH}/restaurants-performance`, {
            params: { period },
        }) as unknown as Promise<RestaurantsPerformanceResponse>;
    }

    async getSubscriptionRevenueTrends(
        period: 'week' | 'month' | 'quarter' | 'year' = 'quarter',
        granularity: GranularityType = 'monthly'
    ): Promise<SubscriptionRevenueResponse> {
        return axiosClient.get<SubscriptionRevenueResponse>(`${this.BASE_PATH}/subscription-revenue-trends`, {
            params: { period, granularity },
        }) as unknown as Promise<SubscriptionRevenueResponse>;
    }

    async getRestaurantStatus(): Promise<RestaurantStatusResponse> {
        return axiosClient.get<RestaurantStatusResponse>(`${this.BASE_PATH}/restaurant-status`) as unknown as Promise<RestaurantStatusResponse>;
    }

    async getAllDashboardData(period: PeriodType = 'month') {
        const [summaryCards, revenueGrowth, restaurantsPerformance, subscriptionRevenue, platformActivity, restaurantStatus] =
            await Promise.all([
                this.getSummaryCards(period),
                this.getGrowthTrends(period, 'daily'),
                this.getRestaurantsPerformance(period),
                this.getSubscriptionRevenueTrends('quarter', 'monthly'),
                this.getGrowthTrends('quarter', 'weekly'),
                this.getRestaurantStatus(),
            ]);

        return {
            summaryCards,
            revenueGrowth,
            restaurantsPerformance,
            subscriptionRevenue,
            platformActivity,
            restaurantStatus,
        };
    }
}

export const superAdminAPI = new SuperAdminAPI();
export default superAdminAPI;
