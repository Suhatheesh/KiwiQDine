import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AllKitchenOrderRequest, InitialKitchenOrderType, OrderStatusUpdateRequest, UpdatePreparationTimeRequest } from "./types";
import { FetchAllOrdersResponse, OrderItemResponse } from "../orders/types";
import { OrderStatus } from "../../utils/constants";

const initialState: InitialKitchenOrderType = {
    data: [],
    loading: false,
    error: null,
    isOrderItemStart: false,
    isOrderItemReady: false,
    total: 0,
    page: "",
    limit: "",
    totalPages: 0,
    isEditingTimeLoading: false
}

const kitchenSlice = createSlice({
    name: '/kitchenSlice',
    initialState: initialState,
    reducers: {
        addOrder: (state, action: PayloadAction<OrderItemResponse>) => {
            state.data = [action.payload, ...state.data];
        },

        /* Fetch All Orders */
        fetchAllKitchenOrdersRequest: (state, _: PayloadAction<AllKitchenOrderRequest | undefined>) => {
            state.loading = true;
            state.error = null;
        },
        fetchAllKitchenOrdersSuccess: (state, action: PayloadAction<FetchAllOrdersResponse>) => {
            state.loading = false;
            const filtered = action.payload.data.filter(
                (i) =>
                    i.status !== OrderStatus.PENDING &&
                    i.status !== OrderStatus.CANCELLED
            );

            const merged = new Map(
                [...filtered].map(item => [item.id, item], ...state.data)
            );

            state.data = Array.from(merged.values());
        },
        fetchAllKitchenOrdersFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        /* Update Orders Status*/
        updateOrderStatusRequest: (state, _: PayloadAction<OrderStatusUpdateRequest>) => {
            state.loading = true;
            state.error = null;
        },
        updateOrderStatusSuccess: (state, action: PayloadAction<{ orderId: string, status: string }>) => {
            state.loading = false;
            state.data = state.data.map(
                (i) => i.id === action.payload.orderId ? { ...i, status: action.payload.status } : i);
        },
        updateOrderStatusFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        /* Start Orders Item*/
        startOrderItemStatusRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.isOrderItemStart = false;
            state.error = null;
        },
        updateOrderItemStatusSuccess: (state, action: PayloadAction<{ orderId: string; itemId: string, status: string, startedAt?: string }>) => {
            state.isOrderItemStart = true;
            state.data = state.data.map(order =>
                order.id === action.payload.orderId
                    ? {
                        ...order,
                        itemsByCategory: order.itemsByCategory?.map(category => ({
                            ...category,
                            items: category.items?.map(item =>
                                item.id === action.payload.itemId
                                    ? { ...item, status: action.payload.status, startedAt: action.payload.startedAt }
                                    : item
                            )
                        }))
                    }
                    : order
            );
        },
        updateOrderItemStatusFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isOrderItemStart = false;
            state.error = action.payload;
        },

        /* Ready Orders Item*/
        readyOrderItemStatusRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.error = null;
        },

        /* Ready Orders*/
        readyOrderStatusRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.error = null;
        },

        /* Served Orders Item*/
        servedOrderItemStatusRequest: (state, _: PayloadAction<OrderStatusUpdateRequest>) => {
            state.loading = true;
            state.error = null;
        },

        /* Completed Orders*/
        orderCompletedRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.error = null;
        },

        /* Update Preparation Time */
        updatePreparationTimeRequest: (state, _: PayloadAction<UpdatePreparationTimeRequest>) => {
            state.isEditingTimeLoading = true;
            state.error = null;
        },
        updatePreparationTimeSuccess: (state, action: PayloadAction<{ orderId: string; itemId: string; preparationTime: number }>) => {
            state.isEditingTimeLoading = false;
            state.data = state.data.map(order =>
                order.id === action.payload.orderId
                    ? {
                        ...order,
                        itemsByCategory: order.itemsByCategory?.map(category => ({
                            ...category,
                            items: category.items?.map(item =>
                                item.id === action.payload.itemId
                                    ? { ...item, estimatedPreparationTime: action.payload.preparationTime }
                                    : item
                            )
                        }))
                    }
                    : order
            );
        },
        updatePreparationTimeFailure: (state, action: PayloadAction<string>) => {
            state.isEditingTimeLoading = false;
            state.error = action.payload;
        },
    }
})

export const {
    addOrder,

    fetchAllKitchenOrdersRequest,
    fetchAllKitchenOrdersSuccess,
    fetchAllKitchenOrdersFaliure,

    updateOrderStatusRequest,
    updateOrderStatusSuccess,
    updateOrderStatusFaliure,

    startOrderItemStatusRequest,
    updateOrderItemStatusSuccess,
    updateOrderItemStatusFaliure,
    readyOrderItemStatusRequest,

    readyOrderStatusRequest,
    servedOrderItemStatusRequest,
    orderCompletedRequest,

    updatePreparationTimeRequest,
    updatePreparationTimeSuccess,
    updatePreparationTimeFailure

} = kitchenSlice.actions

export default kitchenSlice.reducer;
