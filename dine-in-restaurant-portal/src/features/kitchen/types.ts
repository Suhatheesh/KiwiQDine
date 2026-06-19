import { InitialCommonType } from "../../models/BaseType";
import { FetchAllOrdersRequest, FetchAllOrdersResponse, OrderItemResponse, OrderItems } from "../orders/types";

export interface AllKitchenOrderRequest extends FetchAllOrdersRequest {
    restaurantId?: string;
    vendorId?: string;
    status?: string
    date?: string
}

export interface OrderStatusUpdateRequest {
    orderId: string;
    status: string;
    updatedBy: string
}

export interface UpdatePreparationTimeRequest {
    orderItemId: string;
    status: string;
    additionalPreparationTime: number;
    updatedBy: string;
}

export interface AllKitchenOrderItem extends OrderItems {
    order?: OrderItemResponse
}

export interface InitialKitchenOrderType extends InitialCommonType, FetchAllOrdersResponse {
    isOrderItemStart: boolean;
    isOrderItemReady: boolean;
    isEditingTimeLoading: boolean;
}