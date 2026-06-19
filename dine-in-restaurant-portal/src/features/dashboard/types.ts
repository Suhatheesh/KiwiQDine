import { InitialCommonType } from "../../models/BaseType";

export type PeriodType = 'today' | 'week' | 'month' | 'year';

export interface DashboardFilters {
    period: PeriodType;
    startDate?: string;
    endDate?: string;
}

export interface DashboardResponse {
    summaryCards: SummaryCards | null;
    salesOverview: SalesOverview[];
    orderByCategory: OrderByCategory[];
    paymentOverview: PaymentOverview[];
    tableOverview: TableOverview[];
    recentOrders: RecentOrders[];
    topFoods: TopFoods;
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

export interface TopFoods {
    period: string;
    dateRange: {
        startDate: string;
        endDate: string;
    };
    totalItems: number;
    totalRevenue: number;
    top10Foods: {
        rank: number;
        menuId: string;
        name: string;
        image: string | null;
        category: string;
        quantitySold: number;
        revenue: number;
        revenueContribution: number;
    }[];
}

export interface InitialDashboardState extends InitialCommonType {
    summaryCards: SummaryCards | null;
    salesOverview: SalesOverview[];
    orderByCategory: OrderByCategory[];
    paymentOverview: PaymentOverview[];
    tableOverview: TableOverview[];
    recentOrders: RecentOrders[];
    topFoods: TopFoods | null;
}
