import { InitialCommonType } from "../../models/BaseType"
import { OrderByCategory, PaymentOverview, TableOverview } from "../dashboard/types"

export interface AnalyticsData {
    salesOverview: {
        totalRevenue: number,
        trendPercent: number,
        trend: string,
        comparisonPeriod: string,
        peakRevenueDay: string | null,
        peakRevenue: number,
        period: string
    },
    topSellingItems: {
        name: string,
        quantity: number,
        revenue: number,
        percentage: number
    }[],
    ordersByCategory: OrderByCategory[],
    tableOccupancy: {
        totalTables: number,
        occupiedTables: number,
        occupancyRate: number,
        hourlyData: TableOverview[]
    },
    paymentMethods: PaymentOverview[],
    peakHours: PeakHour[]

}

export interface PeakHour {
    time: string,
    hour: number,
    orders: number,
    revenue: number,
    items: number
}

export interface AnalyticsFilters {
    period?: 'today' | 'week' | 'month' | 'year' | 'custom';
    startDate?: string;
    endDate?: string;
    status?: string;
    paymentMethod?: string;
}

export interface OrderAnalyticsData {
    summary: {
        totalOrders: number,
        totalRevenue: number,
        averageOrderValue: number,
    },
    statusCounts: {
        pending: number,
        confirmed: number,
        preparing: number,
        ready: number,
        served: number,
        completed: number,
        cancelled: number,
        abandoned: number,
        completedToday: number
    },
    ordersByStatus: {
        completed: number,
        pending: number,
        preparing: number,
        ready: number
    },
    dateRange: {
        startDate: string,
        endDate: string
    }
}

export interface InitialAnalyticsState extends InitialCommonType {
    analyticsData: AnalyticsData | null;
    orderAnalyticsData: OrderAnalyticsData | null;
}
