import { InitialCommonType } from "../../models/BaseType";

export interface UpdateSubscriptionPlan {
    restaurantId: string;
    newPlanId: string;
    reason: string;
    billingCycle: string;
}

export interface SubscriptionOrderUsage {
    restaurantId: string,
    orderUsageId: string,
    month: string,
    overageInvoiceCost: number,
    overageTableCost: number,
    overageQRCost: number,
    overageUserCost: number,
    totalOverageCost: number,
    billingDate: string
}

export interface SubscriptionUsage {
    restaurant: {
        id: string;
        name: string;
    };
    subscription: {
        planName: string;
        planCode: string;
        billingCycle: string;
        status: string;
        features: string[];
    };
    billing: {
        currentPrice: number;
        invoiceTotal: number;
        nextBillingDate: string;
    };
    usage: {
        completedOrders: number;
        orderLimit: number;
        remainingOrders: number;
        usagePercentage: number;
        isOverLimit: boolean;
    };
    recommendations: {
        shouldUpgrade: boolean;
        suggestedPlan: {
            name: string;
            priceMonthly: number;
            orderLimit: number;
        };
        reason: string;
    };
}

export interface SubscriptionSummary {
    totalRevenue: number;
    monthlyRevenue: number;
    pending: number;
    overdue: number;
    nextBillDate: string;
}

export interface InvoicesResponse {
    id: string;
    invoiceName: string;
    restaurantId: string;
    billing_period: string;
    plan: string;
    amount: number;
    base_amount: number;
    fees: number;
    status: string;
    due_date: string;
    paid_date: string;
    invoiceAttachmentUrl: string;
    created_at: string;
    updated_at: string;
}

export interface CanCreateOrder {
    allowed: boolean;
    isOverage: boolean;
    currentOrders: number;
    orderLimit: number;
    plan: SubscriptionPlan;
}

export interface CanCreateTable {
    allowed: boolean;
    isOverage: boolean;
    currentTables: number;
    tableLimit: number;
    plan: SubscriptionPlan;
}

export interface CanCreateUser {
    allowed: boolean;
    isOverage: boolean;
    currentUsers: number;
    userLimit: number;
    plan: SubscriptionPlan;
}

export interface CanCreateQR {
    allowed: boolean;
    isOverage: boolean;
    currentQR: number;
    qrLimit: number;
    plan: SubscriptionPlan;
}

export interface SubscriptionPlan {
    id?: string | null;
    planId?: string | null;
    name: string;
    code: string;
    description: string;
    priceMonthly: number;
    priceYearly: number;
    invoiceCount?: number;
    yearlySavingsPercent: number;
    status: string;
    billingCycle: string;
    features: string[];
    order: number;
    qrLimit: number;
    userLimit: number;
    tableLimit: number;
    overageChargePerQR: number;
    overageChargePerTable: string;
    isSpecializedPlan: boolean;
    overageChargePerInvoice: string;
    overageChargePerUser: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface InitialSubscriptionPlanType extends InitialCommonType {
    isCreatePlan: boolean;
    plans: SubscriptionPlan[];
    subscriptionUsage: SubscriptionUsage | null;
    subscriptionOrderUsage: SubscriptionOrderUsage | null;
    subscriptionSummary: SubscriptionSummary;
    invoices: InvoicesResponse[];
    currentPlanId?: string | null;
    canCreateOrder: CanCreateOrder | null;
    canCreateTable: CanCreateTable | null;
    canCreateUser: CanCreateUser | null;
    canCreateQR: CanCreateQR | null;
}