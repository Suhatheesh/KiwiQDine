import { PeriodType } from "../features/dashboard/types";

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

export enum SubscriptionPlan {
    BASIC = 'basic',
    PRO = 'pro',
    ENTERPRISE = 'enterprise'
}

export enum QRStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
}

export enum QRTableType {
    TABLE = 'TABLE',
    FOOD_COURT = 'FOOD_COURT',
    TAKE_AWAY = 'TAKE_AWAY',
    PARKING = 'PARKING'
}

export enum TabType {
    MENUITEM,
    CATEGORY,
    ADDON,
    BADGES
}

export enum QtyUpdateType {
    INCREASE,
    DECREASE
}

export enum PaymentMethod {
    CASH = 'cash',
    CARD = 'card',
    QR = 'qr',
    CASHIER = 'cashier', // Deprecated - use specific cashier methods below
    CASHIER_CASH = 'cashier_cash',
    CASHIER_CARD = 'cashier_card',
    CASHIER_QR = 'cashier_qr'
}

export enum PaymentStatus {
    PAID = 'paid',
    PENDING = 'pending'
}

export enum OrderType {
    TAKEAWAY = 'takeaway',
    DINEIN = 'dine_in',
    PARKING = 'parking'
}

export enum OrderStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    PREPARING = 'preparing',
    READY = 'ready',
    INPROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    HOLD = 'hold',
    SERVED = 'served',
    ABANDONED = 'abandoned'
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

export enum SubscriptionPlanType {
    BASIC = 'basic',
    PRO = 'pro',
    ENTERPRISE = 'enterprise',
    PREMIUM = 'premium'
}

export enum PlanStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive'
}

export const COLORS = {
    primary: '#3b82f6', // Professional Blue
    secondary: '#64748b', // Slate
    success: '#10b981', // Emerald
    warning: '#f59e0b', // Amber
    danger: '#ef4444', // Red
    purple: '#8b5cf6', // Violet
    teal: '#14b8a6', // Teal
    orange: '#f97316', // Orange
    blue: '#2563eb', // Royal Blue
    indigo: '#6366f1', // Indigo
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