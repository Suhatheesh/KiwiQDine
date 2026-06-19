import { InitialCommonType } from "../../models/BaseType";

export type PeriodType = 'today' | 'week' | 'month' | 'year';

export interface CommonResponseProperty {
    period: string;
    dateRange: {
        startDate: string;
        endDate: string;
    };
}

export interface SummaryCards {
    todaysSales: {
        totalRevenue: number;
        changePercent: number;
        trend: string;
    };
    totalOrdersToday: {
        count: number;
        dineIn: number;
        takeaway: number;
    };
    activeTables: {
        occupied: number;
        total: number;
        available: number;
    };
    topSellingItem: {
        name: string;
        quantity: number;
    };
}

export interface SalesOverview {
    time: string;
    hour: number;
    revenue: number;
}

export interface OrderByCategory {
    category: string;
    count: number;
}

export interface PaymentOverview {
    method: string;
    count: number;
    amount: number;
    percentage: number;
}

export interface TableOverview {
    time: string;
    hour: number;
    occupied: number;
    total: number;
    occupancyRate: number;
}

export interface RecentOrders {
    orderId: string;
    orderNumber: string;
    tableNo: string;
    customerName: string;
    customerPhone: string;
    customer: {
        id: string;
        name: string;
        phone: string;
    };
    orderType: string;
    itemsCount: number;
    totalAmount: number;
    paymentMethod: string;
    paymentStatus: string;
    orderTime: string;
    orderStatus: string;
    isOnHold: boolean;
    holdReason: string;
}

export interface RestaurantAnalyticsResponse {
    salesOverview: SalesOverview[];
    orderByCategory: OrderByCategory[];
    paymentOverview: PaymentOverview[];
    restaurantAnalytics: RestaurantAnalytics | null;
}

export interface RestaurantAnalytics extends CommonResponseProperty {
    salesOverview: {
        totalRevenue: number;
        trendPercent: number;
        trend: string;
        comparisonPeriod: string;
        peakRevenueDay: string;
        peakRevenue: number;
    }
    topSellingItems: RecentOrders[];
    orderByCategory: OrderByCategory[];
    revenueByCategory: {
        category: string;
        revenue: number;
        orders: number;
        percentage: number;
    }[];
    top5Foods: {
        name: string;
        image: string;
        category: string;
        quantity: number;
        revenue: number;
        revenueContribution: number;
    }[];
    paymentMethods: PaymentOverview[];
    peakHours: {
        time: string;
        hour: number;
        revenue: number;
        orders: number;
        items: number;
    }[];
    customerInsights: {
        totalCustomers: number;
        newCustomers: number;
        returningCustomers: number;
        avgOrdersPerCustomer: number;
        customerRetentionRate: number;
    };
}

export interface DashboardAnalytics extends CommonResponseProperty {
    trends: {
        period?: string;
        revenue?: number;
        subscriptions?: number;
        restaurants?: number;
        monthly?: number;
        yearly?: number;
        planBreakdown?: {
            planName: string;
            subscriptions: number;
            revenue: number;
        }[];
        orders?: number;
        newCustomers?: number;
        newUsers?: number;
        roleBreakdown?: {
            role: string;
            count: number;
        }[];
    }[];
    summary: {
        totalRevenue?: number;
        revenueGrowth?: number;
        totalSubscriptions?: number;
        subscriptionsGrowth?: number;
        totalRestaurants?: number;
        restaurantsGrowth?: number;
        totalUsers?: number;
        usersGrowth?: number;
        avgRevenuePerPeriod: number;
        avgSubscriptionsPerPeriod: number;
    };
    planBreakdown?: {
        planName: string;
        subscriptions: number;
        revenue: number;
        monthly?: number;
        yearly?: number;
        percentage?: number;
    }[];
    billingCycleBreakdown?: {
        cycle: string;
        subscriptions: number;
        revenue: number;
        percentage: number;
    }[];
    availablePlans?: {
        id: string;
        name: string;
        code: string;
        priceMonthly: string;
        priceYearly: string;
        activeSubscriptions: number;
    }[];
}

export interface DashboardAnalyticsResponse {
    subscriptionRevenueResponse: DashboardAnalytics;
    platformGrowthResponse: DashboardAnalytics;
    userGrowthResponse: DashboardAnalytics;
    revenueByPlanResponse: DashboardAnalytics;
}


export interface InitialRestaurantAnalyticsState extends InitialCommonType {
    salesOverview: SalesOverview[];
    orderByCategory: OrderByCategory[];
    paymentOverview: PaymentOverview[];
    restaurantAnalytics: RestaurantAnalytics | null;
    dashboardAnalytics: DashboardAnalyticsResponse | null;
}