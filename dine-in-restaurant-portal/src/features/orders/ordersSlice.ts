import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CancelOrderRequest, CreateAndHoldOrderRequest, CreateOrder, FetchAllOrdersRequest, FetchAllOrdersResponse, HoldOrderRequest, InitialOrderType, OrderItemResponse, OrderLog, SelectedVariant, SelectedAddOn } from "./types";
import { MenuItem } from "../menuItems/types";
import { OrderStatus, PaymentStatus } from "../../utils/constants";

const initialState: InitialOrderType = {
    data: [],
    loading: false,
    error: null,
    cartItem: [],
    isOrderCreated: false,
    order: null,
    orderLogs: [],
    recentLogs: [],
    isOrderConfirmed: false,
    isOrderDelete: false,
    total: 0,
    page: "1",
    limit: "10",
    totalPages: 0,
    isPaginationFetching: false
}

const orderSlice = createSlice({
    name: '/orderSlice',
    initialState: initialState,
    reducers: {
        increaseLimit: (state, action: PayloadAction<string>) => {
            state.limit = action.payload
        },
        pagination: (state, action: PayloadAction<string>) => {
            state.page = action.payload;
        },
        resetPagination: (state) => {
            state.page = "1";
            state.limit = "10";
        },

        addItem: (state, action: PayloadAction<{ item: MenuItem, selectedVariants?: SelectedVariant[], quantity?: number, selectedAddOns?: SelectedAddOn[] }>) => {
            const { item, selectedVariants = [], quantity = 1, selectedAddOns = [] } = action.payload;

            let totalOptionsPrice = 0;
            selectedVariants.forEach(variant => {
                variant.options.forEach(option => {
                    if (option.price) {
                        totalOptionsPrice += Number(option.price);
                    }
                });
            });

            const unitPrice = totalOptionsPrice > 0 ? totalOptionsPrice : Number(item.price);

            const discount = Number(item.discount) || 0;
            const discountedPrice = discount > 0
                ? unitPrice - (unitPrice * discount / 100)
                : unitPrice;

            let addOnsTotal = 0;
            selectedAddOns.forEach(addon => {
                addOnsTotal += addon.unitPrice * addon.quantity;
            });
            const totalPrice = (discountedPrice * quantity) + addOnsTotal;

            const variantKey = selectedVariants.length > 0
                ? JSON.stringify(selectedVariants.sort((a, b) => a.variantName.localeCompare(b.variantName))[0].options[0].name)
                : '';
            const addOnKey = selectedAddOns.length > 0
                ? JSON.stringify(selectedAddOns.sort((a, b) => a.addonId.localeCompare(b.addonId)))
                : '';

            const existingIndex = state.cartItem.findIndex(cartItem => {
                if (cartItem.item.id !== item.id) return false;
                const existingVariantKey = cartItem.selectedVariants && cartItem.selectedVariants.length > 0
                    ? JSON.stringify(cartItem.selectedVariants.sort((a, b) => a.variantName.localeCompare(b.variantName))[0].options[0].name)
                    : '';
                const existingAddOnKey = cartItem.selectedAddOns && cartItem.selectedAddOns.length > 0
                    ? JSON.stringify(cartItem.selectedAddOns.sort((a, b) => a.addonId.localeCompare(b.addonId)))
                    : '';
                return existingVariantKey === variantKey && existingAddOnKey === addOnKey;
            });

            if (existingIndex !== -1) {
                const existingItem = state.cartItem[existingIndex];
                const newQty = existingItem.qty + quantity;
                const newTotal = (discountedPrice * newQty) + addOnsTotal;

                state.cartItem = state.cartItem.map((cartItem, index) =>
                    index === existingIndex
                        ? {
                            ...cartItem,
                            qty: newQty,
                            total: newTotal
                        }
                        : cartItem
                );
            } else {
                state.cartItem = [
                    ...state.cartItem,
                    {
                        qty: quantity,
                        total: totalPrice,
                        item,
                        selectedVariants: selectedVariants.length > 0 ? selectedVariants : undefined,
                        selectedAddOns: selectedAddOns.length > 0 ? selectedAddOns : undefined
                    }
                ];
            }
        },
        increseItemQty: (state, action: PayloadAction<number>) => {
            state.cartItem = state.cartItem.map((i, index) => {
                if (index === action.payload) {
                    let totalOptionsPrice = 0;
                    i.selectedVariants?.forEach(variant => {
                        variant.options.forEach(option => {
                            if (option.price) {
                                totalOptionsPrice += Number(option.price);
                            }
                        });
                    });
                    const addOnsTotal = i.selectedAddOns?.reduce((total, addon) => total + Number(addon.unitPrice), 0);

                    const unitPrice = totalOptionsPrice > 0 ? totalOptionsPrice : Number(i.item.price);
                    const discount = Number(i.item.discount) || 0;
                    const discountedPrice = discount > 0
                        ? unitPrice - (unitPrice * discount / 100)
                        : unitPrice;

                    return {
                        ...i,
                        qty: i.qty + 1,
                        total: (discountedPrice + (addOnsTotal || 0)) * (i.qty + 1)
                    }
                }
                return i
            })
        },
        reduceItemQty: (state, action: PayloadAction<number>) => {
            state.cartItem = state.cartItem.map((i, index) => {
                if (index === action.payload) {
                    let totalOptionsPrice = 0;
                    i.selectedVariants?.forEach(variant => {
                        variant.options.forEach(option => {
                            if (option.price) {
                                totalOptionsPrice += Number(option.price);
                            }
                        });
                    });
                    const addOnsTotal = i.selectedAddOns?.reduce((total, addon) => total + Number(addon.unitPrice), 0);

                    const unitPrice = totalOptionsPrice > 0 ? totalOptionsPrice : Number(i.item.price);
                    const discount = Number(i.item.discount) || 0;
                    const discountedPrice = discount > 0
                        ? unitPrice - (unitPrice * discount / 100)
                        : unitPrice;

                    const newQty = i.qty <= 1 ? 1 : i.qty - 1;
                    return {
                        ...i,
                        qty: newQty,
                        total: (discountedPrice + (addOnsTotal || 0)) * newQty
                    }
                }
                return i
            })
        },
        updateAddons: (state, action: PayloadAction<{ index: number, selectedAddOns: SelectedAddOn[] }>) => {
            state.cartItem = state.cartItem.map((i, index) => {
                if (index === action.payload.index) {
                    return {
                        ...i,
                        selectedAddOns: action.payload.selectedAddOns
                    }
                }
                return i
            })
        },
        removeItem: (state, action: PayloadAction<number>) => {
            state.cartItem = state.cartItem.filter((_, i) => i !== action.payload);
        },
        removeAll: (state) => {
            state.cartItem = []
            state.isOrderCreated = false;
        },
        updateOrderStatus: (state, action: PayloadAction<{ orderId: string, status: string }>) => {
            state.data = state.data?.map(
                (i) => i.id === action.payload.orderId ? { ...i, status: action.payload.status } : i);
        },

        /* Fetch All Orders */
        fetchAllOrdersRequest: (state, _: PayloadAction<FetchAllOrdersRequest | undefined>) => {
            state.loading = true;
            state.isOrderConfirmed = false;
            state.error = null;
        },
        fetchAllOrdersSuccess: (state, action: PayloadAction<{ type?: string, payload: FetchAllOrdersResponse }>) => {
            const { limit, page, total, totalPages, data } = action.payload.payload
            state.loading = false;
            if (action.payload.type === PaymentStatus.PENDING) {
                const merged = new Map(
                    [...data].map(item => [item.id, item], ...state.data)
                );
                state.data = Array.from(merged.values());
            } else if (action.payload.type === OrderStatus.PENDING) {
                state.data = Number(page) === 1 ? data : [
                    ...state.data,
                    ...data.filter(
                        d => !state.data.some(s => s.id === d.id)
                    ),
                ];
            } else {
                state.data = data
            }
            state.limit = limit;
            state.page = page
            state.total = total
            state.totalPages = totalPages
        },
        fetchAllOrdersFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        /* Create Order */
        createOrderRequest: (state, _: PayloadAction<CreateOrder>) => {
            state.loading = true;
            state.isOrderCreated = false;
            state.error = null;
        },
        createOrderSuccess: (state, action: PayloadAction<OrderItemResponse>) => {
            state.loading = false;
            state.isOrderCreated = true;
            state.data = [action.payload, ...state.data!];
        },
        createOrderFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isOrderCreated = false;
            state.error = action.payload;
        },

        /* Update Order */
        updateOrderRequest: (state, _: PayloadAction<{ confirm?: boolean, orderId: string, orderItems: CreateOrder }>) => {
            state.loading = true;
            state.error = null;
        },
        updateOrderSuccess: (state, action: PayloadAction<OrderItemResponse>) => {
            state.loading = false;
            state.isOrderCreated = true;
            state.data = state.data?.map(
                (i) => i.id === action.payload.id ? action.payload : i);
        },
        updateOrderFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isOrderCreated = false;
            state.error = action.payload;
        },

        /* Fetch Orders By Id*/
        fetchOrdersByIdRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.error = null;
        },
        fetchOrdersByIdSuccess: (state, action: PayloadAction<OrderItemResponse>) => {
            state.loading = false;
            state.order = action.payload;
        },
        fetchOrdersByIdFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        /* Fetch Pending Orders By Table Id*/
        fetchPendingOrdersByTableIdRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.error = null;
        },
        fetchPendingOrdersByTableIdSuccess: (state, action: PayloadAction<OrderItemResponse[]>) => {
            state.loading = false;
            state.data = action.payload;
        },
        fetchPendingOrdersByTableIdFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        /* Confirm Order */
        confirmOrderRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.isOrderConfirmed = false;
            state.error = null;
        },
        confirmOrderSuccess: (state, action: PayloadAction<OrderItemResponse>) => {
            state.loading = false;
            state.isOrderConfirmed = true;
            state.data = state.data?.map(
                (i) => i.id === action.payload.id ? action.payload : i);
        },
        confirmOrderFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isOrderConfirmed = false;
            state.error = action.payload;
        },

        /* Delete Order */
        deleteOrderRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.isOrderDelete = false;
            state.error = null;
        },
        deleteOrderSuccess: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isOrderDelete = true;
            state.data = state.data?.filter((i) => !action.payload.includes(i.id!));
        },
        deleteOrderFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isOrderDelete = false;
            state.error = action.payload;
        },

        /* Cancel Order */
        cancelOrderRequest: (state, _: PayloadAction<CancelOrderRequest>) => {
            state.loading = true;
            state.isOrderDelete = true;
            state.error = null;
        },
        cancelOrderSuccess: (state, action: PayloadAction<OrderItemResponse>) => {
            state.loading = false;
            state.isOrderDelete = false;
            state.data = state.data?.map(
                (i) => i.id === action.payload.id ? action.payload : i);
        },
        cancelOrderFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.isOrderDelete = false;
            state.error = action.payload;
        },

        /* Hold Order */
        holdOrderRequest: (state, _: PayloadAction<HoldOrderRequest>) => {
            state.loading = true;
            state.error = null;
        },
        holdOrderSuccess: (state, action: PayloadAction<OrderItemResponse>) => {
            state.loading = false;
            state.data = state.data?.map(
                (i) => i.id === action.payload.id ? action.payload : i);
        },
        holdOrderFaliure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        /* Create And Hold Order */
        createAndHoldOrderRequest: (state, _: PayloadAction<CreateAndHoldOrderRequest>) => {
            state.loading = true;
            state.isOrderCreated = false;
            state.error = null;
        },

        /* Release Order */
        releaseOrderRequest: (state, _: PayloadAction<HoldOrderRequest>) => {
            state.loading = true;
            state.error = null;
        },

        /* Fetch Order Logs */
        fetchOrderLogsRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.error = null;
        },
        fetchOrderLogsSuccess: (state, action: PayloadAction<OrderLog[]>) => {
            state.loading = false;
            state.orderLogs = action.payload;
        },
        fetchOrderLogsFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        /* Fetch Recent Logs */
        fetchRecentLogsRequest: (state, _: PayloadAction<string>) => {
            state.loading = true;
            state.error = null;
        },
        fetchRecentLogsSuccess: (state, action: PayloadAction<OrderLog[]>) => {
            state.loading = false;
            state.recentLogs = action.payload;
        },
        fetchRecentLogsFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },
    }
});

export const {
    increaseLimit,
    pagination,
    resetPagination,

    addItem,
    increseItemQty,
    reduceItemQty,
    removeItem,
    removeAll,
    updateOrderStatus,

    fetchAllOrdersRequest,
    fetchAllOrdersSuccess,
    fetchAllOrdersFaliure,

    createOrderRequest,
    createOrderSuccess,
    createOrderFaliure,

    updateOrderRequest,
    updateOrderSuccess,
    updateOrderFaliure,

    fetchOrdersByIdRequest,
    fetchOrdersByIdSuccess,
    fetchOrdersByIdFaliure,

    fetchPendingOrdersByTableIdRequest,
    fetchPendingOrdersByTableIdSuccess,
    fetchPendingOrdersByTableIdFaliure,

    confirmOrderRequest,
    confirmOrderSuccess,
    confirmOrderFaliure,

    deleteOrderRequest,
    deleteOrderSuccess,
    deleteOrderFaliure,

    cancelOrderRequest,
    cancelOrderSuccess,
    cancelOrderFaliure,

    holdOrderRequest,
    holdOrderSuccess,
    holdOrderFaliure,

    createAndHoldOrderRequest,

    releaseOrderRequest,

    fetchOrderLogsRequest,
    fetchOrderLogsSuccess,
    fetchOrderLogsFailure,

    fetchRecentLogsRequest,
    fetchRecentLogsSuccess,
    fetchRecentLogsFailure,

    updateAddons

} = orderSlice.actions;

export default orderSlice.reducer;