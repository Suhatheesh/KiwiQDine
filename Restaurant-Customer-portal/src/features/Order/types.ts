import { InitialCommonType } from "../../model/BaseType";
import { SelectedAddOn } from "../Cart/types";

export interface OrderRequest {
    restaurantId?: string;
    phone?: string;
    customerName?: string;
    tableNo?: string;
    tableId?: string;
    qrCodeId?: string;
    paymentMethod?: string;
    vehicleModel?: string;
    vehicleNumber?: string;
    orderType?: string;
    orderItems?: OrderItemRequest[];
    notes?: string;
}

export interface OrderItemRequest {
    menuId: string;
    quantity: number;
    specialInstructions?: SpecialInstructions;
    selectedAddons?: { addonId: string, quantity: number }[];
}

export interface SpecialInstructions {
    portion?: string;
    rice?: string;
    chicken?: string;
    spiceLevel?: string;
    note?: string;
}

export interface OrderResponse {
    customer: Customer;
    restaurant: Restaurant;
    orderItems: OrderItem[];
    totalAmount: number;
}

export interface Customer {
    id: string;
    phone: string;
    customerName: string;
}

export interface Restaurant {
    id: string;
    name: string;
    address: string;
}

export interface OrderItem {
    menuId: string;
    menuName: string;
    menuImage?: string | null;
    category: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    specialInstructions: SpecialInstructions;
}

export interface OrderStatusUpdate {
    id?: string;
    orderId: string;
    status: string;
    order: OrderSuccessResponse;
}

export interface OrderSuccessResponse {
    id?: string;
    orderNumber?: string;
    restaurant?: Restaurant
    customerName?: string;
    customer: Customer;
    tableNo?: string | null;
    status?: string;
    totalAmount?: string;
    isOnHold?: boolean;
    holdReason?: string;
    itemsByCategory?: OrderItemsByCategory[];
    items?: OrderItemsByCategory[];
    orderItems?: OrderItems[]; // New direct array from live tracking
    itemsProgress?: ItemsProgress; // New progress summary
    payments?: any[]
    paymentMethod?: string;
    paymentStatus?: string;
    orderId?: string;
    itemCount?: number;
    createdAt?: string;
    updatedAt?: string;
    isReviewed?: boolean;
}

export interface ItemsProgress {
    total: number;
    byStatus: {
        pending: number;
        in_progress: number;
        ready: number;
        served: number;
    };
    progressPercentage: number;
}

export interface OrderItemsByCategory {
    category: string;
    items: OrderItems[];
}

export interface OrderItems {
    id?: string;
    quantity?: number;
    unitPrice?: string;
    totalPrice?: string;
    specialInstructions?: SpecialInstructions | null;
    status?: string;
    tableNo?: string | null;
    startedAt?: string | null;
    readyAt?: string | null;
    servedAt?: string | null;
    estimatedPreparationTime?: number; // in minutes
    elapsedTime?: number; // New: server calculated minutes since started
    remainingTime?: number; // New: server calculated minutes remaining
    menuId?: string;
    menuName?: string;
    menuImage?: string | null;
    category?: string;
    addons?: SelectedAddOn[]; // New: item addons
    createdAt?: string;
    updatedAt?: string;
}

export interface OrdersDashboardResponse {
    ordersByRestaurant: OrdersByRestaurant[];
    totalOrders: number;
    totalAmount: number;

}

export interface OrdersByRestaurant {
    restaurantId: string;
    restaurantName: string;
    orders: OrderSuccessResponse[];
    overallStatus: string;
}

export interface InitialOrderType extends InitialCommonType {
    orders: OrdersByRestaurant[];
    restaurantOrders: OrderSuccessResponse[];
    order: OrderSuccessResponse | null;
    isOrderCreate: boolean;
}