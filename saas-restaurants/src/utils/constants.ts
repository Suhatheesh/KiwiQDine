import { PeriodType } from "../features/analytics/types";

export enum UserRole {
    SUPER_ADMIN = 'super_admin',      // Platform administrator - Full system access
    TENANT_ADMIN = 'tenant_admin',    // Tenant administrator - Tenant-level management
    MANAGER = 'manager',              // Restaurant/Outlet manager - Operations management
    WAITER = 'waiter',                // Service staff - Order management and service
    KITCHEN_STAFF = 'kitchen_staff'   // Kitchen staff - Kitchen operations
}

export enum UserStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended'
}

export enum TenantStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    SUSPENDED = 'suspended'
}

export enum TenantType {
    RESTAURANT = 'restaurant',
    FOOD_COURT = 'food_court'
}

export enum SubscriptionPlanType {
    TRIAL = 'trial',
    DINE_SOON_LITE = 'DineSoon Lite',
    DINE_SOON_PRO = 'DineSoon Pro',
    DINE_SOON_ENTERPRISE = 'DineSoon Enterprise',
    DINE_SOON_PREMIUM = 'DineSoon Premium'
}

export enum TYPE {
    RESTAURANT,
    USER
}

export enum PlanStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive'
}

export enum BillingCycle {
    MONTHLY = 'monthly',
    YEARLY = 'yearly'
}

export enum ToastTypes {
    SUCCESS = 'success',
    ERROR = 'error',
    INFO = 'info'
}

export enum TableStatus {
    AVAILABLE = 'available',
    OCCUPIED = 'occupied',
    RESERVED = 'reserved',
    MAINTENANCE = 'maintenance'
}

export enum PaymentTiming {
    PAY_AT_LAST = 'pay_at_last',
    PAY_AT_FIRST = 'pay_at_first'
}

export enum TabType {
    MENUITEM,
    CATEGORY,
    ADDON
}

export enum OrderType {
    TAKEAWAY = 'takeaway',
    DINEIN = 'dine_in',
    PARKING = 'parking'
}

export const TableStatusLabels = {
    available: 'Available',
    occupied: 'Occupied',
    reserved: 'Reserved',
    maintenance: 'Maintenance',
} as const;

export const TableStatusColors = {
    available: {
        bg: 'bg-green-50',
        border: 'border-green-100',
        text: 'text-green-700',
        badge: 'bg-green-100 text-green-700',
        dot: 'bg-green-500',
    },
    occupied: {
        bg: 'bg-red-50',
        border: 'border-red-100',
        text: 'text-red-700',
        badge: 'bg-red-100 text-red-700',
        dot: 'bg-red-500',
    },
    reserved: {
        bg: 'bg-orange-50',
        border: 'border-orange-100',
        text: 'text-orange-700',
        badge: 'bg-orange-100 text-orange-700',
        dot: 'bg-orange-500',
    },
    maintenance: {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-700',
        badge: 'bg-gray-100 text-gray-700',
        dot: 'bg-gray-500',
    },
} as const;

export const COLORS = {
    primary: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    blue: '#3b82f6',
    pink: '#ec4899',
    orange: '#f97316',
};

export const PAYMENT_COLORS: Record<string, string> = {
    cash: COLORS.success,
    card: COLORS.blue,
    cashier: COLORS.purple,
};

export const periodOptions: { value: PeriodType; label: string }[] = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
];

export enum QRTableType {
    TABLE = 'TABLE',
    FOOD_COURT = 'FOOD_COURT',
    TAKE_AWAY = 'TAKE_AWAY',
    PARKING = 'PARKING'
}

export enum QRStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}
