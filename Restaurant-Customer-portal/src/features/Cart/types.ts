import { InitialCommonType } from "../../model/BaseType";
import { MenuItem } from "../Menu/types";
import { OrderSuccessResponse } from "../Order/types";

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

export interface CartItemPayload {
    item: MenuItem;
    selectedVariants?: SelectedVariant[];
    selectedAddOns?: SelectedAddOn[];
    quantity?: number;
    specialInstructions?: string;
}

export interface CartItem {
    item: MenuItem;
    qty: number;
    total: number;
    selectedVariants?: SelectedVariant[];
    selectedAddOns?: SelectedAddOn[];
    specialInstructions?: string;
}

export interface CartResponse {
    id: string;
    sessionId: string;
    customerId: string | null;
    tenantId: string;
    items: Item[];
    totalAmount: number;
    tableId: string | null;
    tableNo: string | null;
    qrCodeId: string | null;
    orderType: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface Item {
    restaurantId: string;
    restaurantName: string;
    menuId: string;
    menuName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    specialInstructions: { [key: string]: any };
    selectedAddons?: { addonId: string, quantity: number }[];
    image: string | null;
}

export interface AddCartItemRequest {
    restaurantId?: string;
    menuId: string;
    quantity: number;
    specialInstructions?: { [key: string]: any };
    selectedAddons?: { addonId: string, quantity: number }[];
}

export interface CalculateItemsTotalResponse {
    itemsByRestaurant: {
        restaurantId: string;
        restaurantName: string;
        items: Item[];
        subtotal: number;
    }[];
    totalAmount: string;
    itemCount: number;
}

export interface CheckoutSuccessResponse {
    orders: OrderSuccessResponse[];
    totalAmount: number;
}

export interface InitialCartType extends InitialCommonType {
    order: OrderSuccessResponse[] | null;
    cartItem: CartItem[];
    cartResponse: CartResponse | null;
    calculateItemsTotalResponse: CalculateItemsTotalResponse | null;
    notes: string;
}
