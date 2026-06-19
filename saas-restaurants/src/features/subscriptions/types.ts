import { InitialCommonType } from "../../models/BaseType";

export interface CreateSubscriptionPlan {
    name: string;
    code?: string;
    description: string;
    priceMonthly: number;
    priceYearly?: number;
    orderLimit: number;
    yearlySavingsPercent: number;
    qrLimit: number;
    userLimit: number;
    status?: string;
    overageChargePerInvoice: number;
    overageChargePerUser: number;
    billingCycle: string;
    features: string[];
    order: number;
    tableLimit: number;
    overageChargePerQR: number;
    overageChargePerTable: number;
    isSpecializedPlan: boolean;
    tenantId?: string;
    tenantIds: string[];
}

export interface fetchSubscriptionPlan {
    includeArchived?: boolean,
    isSpecializedPlan?: boolean
    planName?: string
    tenantName?: string
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

export interface CurrentPlanResponseDto {
    id: string;
    name: string;
    code: string;
    description: string;
    priceMonthly: string;
    priceYearly: string;
    status: string;
    features: string[];
    billingCycle: string;
    yearlySavingsPercent: string;
    createdAt: string;
    updatedAt: string;
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

export interface fetchSubscriptionPlan {
    status?: string;
    includeArchived?: boolean;
    isSpecializedPlan?: boolean;
}

export interface SubscriptionPlan extends CreateSubscriptionPlan {
    id?: string;
    specializedPlanId?: string | null;
    createdAt?: string;
    updatedAt?: string;
    isArchived?: boolean;
    tenantNames?: string[] | null;
    olderId?: string;
}

export interface InitialSubscriptionPlanType extends InitialCommonType {
    isCreatePlan: boolean;
    plans: SubscriptionPlan[];
    canCreateTable: CanCreateTable | null;
    canCreateUser: CanCreateUser | null;
    canCreateQR: CanCreateQR | null;
    currentPlan: CurrentPlanResponseDto | null;
}