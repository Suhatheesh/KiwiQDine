import axiosClient from "../../api/axiosClient";
import { OrderRequest } from "../Order/types";
import { AddCartItemRequest } from "./types";

const CartAPI = {
    calculateItemsTotal: () => axiosClient.get(`/api/customer-portal/cart/total`),
    fetchCart: () => axiosClient.get(`/api/customer-portal/cart`),
    addCart: (payload: AddCartItemRequest) => axiosClient.post(`/api/customer-portal/cart/items`, payload),
    updateCart: (payload: AddCartItemRequest) => {
        const { restaurantId, ...rest } = payload;
        return axiosClient.patch(`/api/customer-portal/cart/items`, rest);
    },
    deleteCart: (menuId: string, selectedAddons?: { addonId: string, quantity: number }[]) => axiosClient.delete(`/api/customer-portal/cart/items`, { data: { menuId, selectedAddons } }),
    orderCheckout: (args: OrderRequest) => axiosClient.post('/api/customer-portal/cart/checkout', args),
}

export default CartAPI;
