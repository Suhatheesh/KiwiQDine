import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { InitialOrderType, OrderRequest, OrderResponse, OrdersDashboardResponse, OrderSuccessResponse } from "./types";

const initialState: InitialOrderType = {
    loading: false,
    orders: [],
    restaurantOrders: [],
    error: null,
    order: null,
    isOrderCreate: false
}

const orderSlice = createSlice({
    name: 'order',
    initialState: initialState,
    reducers: {
        resetOrderState: (state) => {
            state.isOrderCreate = false;
            state.order = null;
        },

        calculateOrderTotalRequest: (state, _: PayloadAction<OrderRequest>) => {
            state.loading = true;
            state.isOrderCreate = false;
            state.order = null;
        },
        calculateOrderTotalSuccess: (state, _: PayloadAction<OrderResponse>) => {
            state.loading = false;
        },
        calculateOrderTotalFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },
        updateOrderFromWebSocket: (state, action: PayloadAction<OrderSuccessResponse>) => {
            if (!state.order) return;
            state.order = {
                ...state.order,
                itemsByCategory: state.order.itemsByCategory?.map(category => ({
                    ...category,
                    items: category.items?.map(item => {
                        const updatedItem = action.payload.orderItems?.find(orderItem => orderItem.id === item.id);
                        return {
                            ...item,
                            startedAt: updatedItem?.startedAt ?? item.startedAt,
                            readyAt: updatedItem?.readyAt ?? item.readyAt,
                            servedAt: updatedItem?.servedAt ?? item.servedAt,
                            status: updatedItem?.status ?? item.status,
                        };
                    })
                })),
                status: action.payload.status
            };
        },

        createOrderRequest: (state, _: PayloadAction<OrderRequest>) => {
            state.loading = true;
            state.error = null;
            state.isOrderCreate = false;
        },
        createOrderSuccess: (state, action: PayloadAction<OrderSuccessResponse>) => {
            state.loading = false;
            state.order = action.payload;
            state.isOrderCreate = true;
        },
        createOrderFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        fetchOrderByIdRequest: (state, _: PayloadAction<{ orderId: string, phone: string }>) => {
            state.loading = true;
        },
        fetchOrderByIdSuccess: (state, action: PayloadAction<OrderSuccessResponse>) => {
            state.loading = false;
            state.order = action.payload;
        },
        fetchOrderByIdFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        fetchAllOrdersRequest: (state, _: PayloadAction<{ phone: string, tenantId?: string }>) => {
            state.loading = true;
        },
        fetchAllOrdersSuccess: (state, action: PayloadAction<OrdersDashboardResponse>) => {
            state.loading = false;
            state.orders = action.payload.ordersByRestaurant;
        },
        fetchAllOrdersFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        fetchAllRestaurantOrdersRequest: (state, _: PayloadAction<{ phone: string, restaurantId?: string, activeOnly?: boolean }>) => {
            state.loading = true;
        },
        fetchAllRestaurantOrdersSuccess: (state, action: PayloadAction<OrderSuccessResponse[]>) => {
            state.loading = false;
            state.restaurantOrders = action.payload;
        },
        fetchAllRestaurantOrdersFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },
    },
})
export const {
    calculateOrderTotalRequest,
    calculateOrderTotalSuccess,
    calculateOrderTotalFailure,
    createOrderRequest,
    createOrderSuccess,
    createOrderFailure,
    updateOrderFromWebSocket,

    fetchOrderByIdRequest,
    fetchOrderByIdSuccess,
    fetchOrderByIdFailure,

    fetchAllOrdersRequest,
    fetchAllOrdersSuccess,
    fetchAllOrdersFailure,

    fetchAllRestaurantOrdersRequest,
    fetchAllRestaurantOrdersSuccess,
    fetchAllRestaurantOrdersFailure,

    resetOrderState,
} = orderSlice.actions;
export default orderSlice.reducer;