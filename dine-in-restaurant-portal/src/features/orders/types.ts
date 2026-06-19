import { FetchAllResponse, InitialCommonType } from "../../models/BaseType";
import { MenuItem } from "../menuItems/types";
import { Restaurant } from "../restaurants/types";

export interface FetchAllOrdersRequest {
    restaurantId?: string
    status?: string
    date?: string
    paymentStatus?: string;
    orderType?: string;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    isHold?: boolean;
    paymentMethod?: string;
    isWaiterConfirmation?: boolean;
}

export interface CreateOrder {
    restaurantId?: string;
    customerName?: string;
    phone?: string;
    tableNo?: string;
    orderItems?: OrderItemsRequest[];
    notes?: string;
    paymentMethod?: string;
    tableId?: string;
    orderType?: string;
    restaurantType?: string;
}

export interface CancelOrderRequest {
    reason: string;
    updatedBy: string;
    orderId?: string;
}

export interface HoldOrderRequest {
    reason?: string;
    updatedBy?: string;
    orderId?: string;
}

export interface CreateAndHoldOrderRequest extends CreateOrder {
    reason: string;
    updatedBy: string;
}

export interface OrderItemsRequest {
    menuId?: string;
    menuImage?: string | null;
    quantity?: number;
    specialInstructions?: SpecialInstructions | string | null;
    selectedAddons?: { addonId: string, quantity: number }[];
}

export interface FetchAllOrdersResponse extends FetchAllResponse {
    data: OrderItemResponse[];
}

export interface OrderItemResponse {
    id?: string;
    orderNumber?: string;
    restaurant?: Restaurant
    customerName?: string;
    customerPhone?: string;
    tableNo?: string | null;
    status: string;
    estimatedPreparationTime?: number;
    startedAt?: string;
    readyAt?: string;
    servedAt?: string;
    totalAmount?: string;
    isOnHold?: boolean;
    holdReason?: string;
    subtotal?: string;
    serviceCharge?: string;
    tax?: string;
    discount?: string;
    itemsByCategory?: OrderItemsByCategory[];
    payments?: any[]
    paymentMethod?: string;
    vehicleModel?: string | null;
    vehicleNumber?: string | null;
    paymentStatus?: string;
    hasReview?: boolean;
    amountTendered?: string | null;
    changeReturned?: string | null;
    review?: {
        id?: string;
        rating?: number;
        comment?: string;
        createdAt?: string;
    };
    orderId?: string;
    orderType?: string;
    createdAt?: string;
    updatedAt?: string;
    note?: string;
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
    estimatedPreparationTime?: number; // Maximum preparation time in minutes
    menuId?: string;
    menuName?: string;
    menuImage?: string | null;
    category?: string;
    createdAt?: string;
    updatedAt?: string;
    addons?: SelectedAddOn[]
}

export interface Customer {
    id?: string;
    phone?: string;
    name?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface SpecialInstructions {
    portion?: string;
    rice?: string;
    chicken?: string;
    spiceLevel?: string;
    note?: string;
}

export interface SelectedVariant {
    variantName: string;
    options: {
        name: string;
        price?: number;
    }[];
}

export interface SelectedAddOn {
    id: string;
    addonId: string;
    addonName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    name?: string;
}

export interface CartItem {
    item: MenuItem;
    qty: number;
    total: number;
    selectedVariants?: SelectedVariant[];
    selectedAddOns?: SelectedAddOn[];
}

export interface OrderLog {
    id: string;
    action: string;
    status: string;
    performedByName: string;
    performedByRole: string;
    notes: string;
    createdAt: string;
    order?: OrderItemResponse;
}

export interface InitialOrderType extends InitialCommonType, FetchAllOrdersResponse {
    order: OrderItemResponse | null;
    orderLogs: OrderLog[];
    recentLogs: OrderLog[];
    isOrderCreated: boolean;
    isOrderConfirmed: boolean;
    isPaginationFetching: boolean;
    isOrderDelete: boolean;
    cartItem: CartItem[];
}