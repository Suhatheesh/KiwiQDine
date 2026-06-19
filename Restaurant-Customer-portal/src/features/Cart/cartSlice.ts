import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AddCartItemRequest, CalculateItemsTotalResponse, CartItemPayload, CartResponse, InitialCartType } from "./types";
import { RootState } from "../../app/store";
import { OrderRequest, OrderSuccessResponse } from "../Order/types";

const initialState: InitialCartType = {
    cartItem: JSON.parse(sessionStorage.getItem('cartItem') ?? '[]'),
    cartResponse: null,
    loading: false,
    error: null,
    calculateItemsTotalResponse: null,
    order: null,
    notes: ""
};

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        resetCartState: (state) => {
            state.cartItem = [];
            state.cartResponse = null;
            state.loading = false;
            state.error = null;
            state.calculateItemsTotalResponse = null;
            state.order = null;
        },

        addItem: (state, action: PayloadAction<CartItemPayload>) => {
            const { item, selectedVariants = [], selectedAddOns = [], quantity = 1, specialInstructions } = action.payload;


            const variantKey = selectedVariants.length > 0
                ? JSON.stringify(selectedVariants.sort((a, b) => a.variantName.localeCompare(b.variantName)))
                : '';

            const addonsKey = selectedAddOns.length > 0
                ? JSON.stringify(selectedAddOns.sort((a, b) => a.addonId.localeCompare(b.addonId)))
                : '';

            const specialInstructionsKey = specialInstructions ? JSON.stringify(specialInstructions) : '';

            const existingIndex = state.cartItem.findIndex(cartItem => {
                if (cartItem.item.id !== item.id) return false;
                const existingKey = cartItem.selectedVariants && cartItem.selectedVariants.length > 0
                    ? JSON.stringify(cartItem.selectedVariants.sort((a, b) => a.variantName.localeCompare(b.variantName)))
                    : '';
                const existingAddonsKey = cartItem.selectedAddOns && cartItem.selectedAddOns.length > 0
                    ? JSON.stringify(cartItem.selectedAddOns.sort((a, b) => a.addonId.localeCompare(b.addonId)))
                    : '';
                const existingSpecialInstructionsKey = cartItem.specialInstructions ? JSON.stringify(cartItem.specialInstructions) : '';
                return existingKey === variantKey && existingAddonsKey === addonsKey && existingSpecialInstructionsKey === specialInstructionsKey;
            });

            const getUnitPrice = () => {
                const hasMetadataOptions = item.variantOptions && item.variantOptions.some(v => v.options && v.options.length > 0);
                const hasAddons = item.menuAddons && item.menuAddons.length > 0;

                let totalUnitPrice = 0;
                if (!hasMetadataOptions) {
                    totalUnitPrice = Number(item.price) || 0;
                } else if (selectedVariants && selectedVariants.length > 0) {
                    totalUnitPrice = selectedVariants.reduce((total, variant) => {
                        return total + (variant.options?.reduce((vTotal, option) => vTotal + (Number(option.price) || 0), 0) || 0);
                    }, 0);
                }

                if (hasAddons && selectedAddOns && selectedAddOns.length > 0) {
                    totalUnitPrice += selectedAddOns.reduce((aTotal, addon) => aTotal + addon.unitPrice, 0);
                }

                return totalUnitPrice;
            };

            const unitPrice = getUnitPrice();

            const discount = Number(item.discount) || 0;
            const discountedPrice = discount > 0
                ? unitPrice - (unitPrice * discount / 100)
                : unitPrice;

            if (existingIndex !== -1) {
                state.cartItem = state.cartItem.map((cartItem, index) =>
                    index === existingIndex
                        ? {
                            ...cartItem,
                            qty: cartItem.qty + quantity,
                            total: discountedPrice * (cartItem.qty + quantity),
                            specialInstructions: specialInstructions || cartItem.specialInstructions
                        }
                        : cartItem
                );
            } else {
                state.cartItem = [
                    ...state.cartItem,
                    {
                        qty: quantity,
                        total: discountedPrice * quantity,
                        item,
                        selectedVariants: selectedVariants.length > 0 ? selectedVariants : undefined,
                        selectedAddOns: selectedAddOns.length > 0 ? selectedAddOns : undefined,
                        specialInstructions: specialInstructions || undefined
                    }
                ];
            }
        },
        increseItemQty: (state, action: PayloadAction<number>) => {
            state.cartItem = state.cartItem.map((i, index) => {
                if (index === action.payload) {
                    const getUnitPrice = () => {
                        const hasMetadataOptions = i.item.variantOptions && i.item.variantOptions.some(v => v.options && v.options.length > 0);
                        if (!hasMetadataOptions) return Number(i.item.price) || 0;

                        if (!i.selectedVariants || i.selectedVariants.length === 0) return 0;

                        return i.selectedVariants.reduce((total, variant) => {
                            return total + (variant.options?.reduce((vTotal, option) => vTotal + (Number(option.price) || 0), 0) || 0);
                        }, 0);
                    };

                    const addOnsTotal = i.selectedAddOns?.reduce((total, addon) => total + Number(addon.unitPrice), 0);

                    const unitPrice = getUnitPrice();
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
                    const getUnitPrice = () => {
                        const hasMetadataOptions = i.item.variantOptions && i.item.variantOptions.some(v => v.options && v.options.length > 0);
                        if (!hasMetadataOptions) return Number(i.item.price) || 0;

                        if (!i.selectedVariants || i.selectedVariants.length === 0) return 0;

                        return i.selectedVariants.reduce((total, variant) => {
                            return total + (variant.options?.reduce((vTotal, option) => vTotal + (Number(option.price) || 0), 0) || 0);
                        }, 0);
                    };
                    const addOnsTotal = i.selectedAddOns?.reduce((total, addon) => total + Number(addon.unitPrice), 0);

                    const unitPrice = getUnitPrice();
                    const discount = Number(i.item.discount) || 0;
                    const discountedPrice = discount > 0
                        ? unitPrice - (unitPrice * discount / 100)
                        : unitPrice;
                    return {
                        ...i,
                        qty: i.qty <= 1 ? 1 : i.qty - 1,
                        total: (discountedPrice + (addOnsTotal || 0)) * (i.qty <= 1 ? 1 : i.qty - 1)
                    }
                }
                return i
            })
        },
        setNotes: (state, action: PayloadAction<string>) => {
            state.notes = action.payload;
        },
        removeItem: (state, action: PayloadAction<number>) => {
            state.cartItem = state.cartItem.filter((_, i) => i !== action.payload);
        },
        clearCart: (state) => {
            state.cartItem = [];
        },

        fetchCartRequest: (state) => {
            state.loading = true;
        },
        fetchCartSuccess: (state, action: PayloadAction<CartResponse>) => {
            state.loading = false;
            state.cartResponse = action.payload;
        },
        fetchCartFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        addCartItemRequest: (state, _: PayloadAction<AddCartItemRequest>) => {
            state.loading = true;
        },
        addCartItemSuccess: (state, action: PayloadAction<CartResponse>) => {
            state.loading = false;
            state.cartResponse = action.payload;
        },
        addCartItemFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        updateCartItemRequest: (state, _: PayloadAction<AddCartItemRequest>) => {
            state.loading = true;
        },
        updateCartItemSuccess: (state, action: PayloadAction<CartResponse>) => {
            state.loading = false;
            state.cartResponse = action.payload;
        },
        updateCartItemFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        deleteCartItemRequest: (state, _: PayloadAction<{ menuId: string, selectedAddons?: { addonId: string, quantity: number }[] }>) => {
            state.loading = true;
        },
        deleteCartItemSuccess: (state, action: PayloadAction<CartResponse>) => {
            state.loading = false;
            state.cartResponse = action.payload;
        },
        deleteCartItemFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        calculateItemsTotalRequest: (state) => {
            state.loading = true;
        },
        calculateItemsTotalSuccess: (state, action: PayloadAction<CalculateItemsTotalResponse>) => {
            state.loading = false;
            state.calculateItemsTotalResponse = action.payload;
        },
        calculateItemsTotalFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.error = action.payload;
        },

        orderCheckoutRequest: (state, _: PayloadAction<OrderRequest>) => {
            state.loading = true;
            state.order = null;
        },
        orderCheckoutSuccess: (state, action: PayloadAction<OrderSuccessResponse[]>) => {
            console.log(action.payload);

            state.loading = false;
            state.order = action.payload;
        },
        orderCheckoutFailure: (state, action: PayloadAction<string>) => {
            state.loading = false;
            state.order = null;
            state.error = action.payload;
        },
    },
});

export const {
    resetCartState,
    addItem,
    increseItemQty,
    reduceItemQty,
    removeItem,
    clearCart,
    setNotes,

    fetchCartRequest,
    fetchCartSuccess,
    fetchCartFailure,

    addCartItemRequest,
    addCartItemSuccess,
    addCartItemFailure,

    updateCartItemRequest,
    updateCartItemSuccess,
    updateCartItemFailure,

    deleteCartItemRequest,
    deleteCartItemSuccess,
    deleteCartItemFailure,

    calculateItemsTotalRequest,
    calculateItemsTotalSuccess,
    calculateItemsTotalFailure,

    orderCheckoutRequest,
    orderCheckoutSuccess,
    orderCheckoutFailure
} = cartSlice.actions;

// Selectors
export const selectCartItems = (state: RootState) => state.cart.cartItem;

export const selectCartTotal = (state: RootState) =>
    state.cart.cartItem.reduce((total, item) => total + item.total, 0);

export const selectCartCount = (state: RootState) =>
    state.cart.cartItem.reduce((count, item) => count + item.qty, 0);

export const selectItemQuantity = (state: RootState, itemId: string) =>
    state.cart.cartItem.find((item) => item.item.id === itemId)?.qty || 0;

export default cartSlice.reducer;
