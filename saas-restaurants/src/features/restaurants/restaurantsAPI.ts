import axiosClient from "../../api/axiosClient";
import { RestaurantRequestResponse, RestaurantAllRequest, RestaurantResponse, RestaurantAllRequestByTenant, Data, WalletSummary, WalletTransaction, BankDetails, InvoiceResponseDto, RestaurantSummary } from "./types";
import { UploadMenuItemImageResponse } from "../menuItems/types";

const RestaurantsAPI = {
    fetchAllRestaurants: (args: RestaurantAllRequest) => axiosClient.get<RestaurantResponse>('/api/restaurants', { params: args }),
    fetchAllRestaurantsByTenant: (args: RestaurantAllRequestByTenant) => axiosClient.get<Data>(`/api/tenants/${args.tenantId}/outlets`, { params: { page: args.page, limit: args.limit } }),
    createRestaurants: (args: RestaurantRequestResponse) => {
        const { tenantId, ...rest } = args;
        return axiosClient.post(`/api/tenants/${tenantId}/outlets`, rest)
    },
    updateRestaurants: (args: RestaurantRequestResponse) => {
        const { tenantId, restaurantID, id, ...rest } = args;
        return axiosClient.patch(`/api/tenants/${tenantId}/outlets/${restaurantID}`, rest)
    },
    deleteRestaurants: (args: RestaurantRequestResponse) => axiosClient.delete(`/api/tenants/${args.tenantId}/outlets/${args.id}`),
    reactivateRestaurant: (tenantId: string, restaurantId: string) => axiosClient.post(`/api/tenants/${tenantId}/outlets/${restaurantId}/reactivate`),
    fetchRestaurantById: (restaurantId: string) => axiosClient.get(`/api/restaurants/${restaurantId}`),
    fetchWalletSummary: (restaurantId: string) =>
        axiosClient.get<{ data: WalletSummary }>(`/api/restaurants/${restaurantId}/wallet-balance`),
    fetchWalletTransactions: (restaurantId: string) =>
        axiosClient.get<WalletTransaction[]>(`/api/transactions/${restaurantId}`),
    fetchBankDetails: (restaurantId: string) =>
        axiosClient.get<{ data: BankDetails }>(`/api/outlets/bank-details/${restaurantId}`),
    updateBankDetails: (restaurantId: string, data: BankDetails) => {
        axiosClient.patch<{ data: BankDetails }>(`/api/outlets/bank-details/${restaurantId}`, data)
    },
    uploadImage: (file: File) => {
        const formData = new FormData();
        formData.append('image', file);
        return axiosClient.post<UploadMenuItemImageResponse>('/api/upload/restaurant', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    fetchInvoices: (restaurantId: string) =>
        axiosClient.get<InvoiceResponseDto[]>(`/api/invoices/${restaurantId}`),
    fetchRestaurantSummary: (period: string = 'month') =>
        axiosClient.get<RestaurantSummary>(`/api/super-admin/dashboard/restaurants/summary`, { params: { period } }),
    fetchSubscriptionOrderUsage: (restaurantId: string) => axiosClient.get(`/api/subscription/restaurants/${restaurantId}/order-usage`),
    updateGracePeriodEndDate: (restaurantId: string, gracePeriodEndDate: string) => axiosClient.patch(`/api/subscription/restaurants/${restaurantId}/grace-period`, { gracePeriodEndDate }),
}

export default RestaurantsAPI;
