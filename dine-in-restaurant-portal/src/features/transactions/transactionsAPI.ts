import axiosClient from "../../api/axiosClient";
import { TransactionFilters } from "./types";

const TransactionsAPI = {
    /**
     * Get wallet balance for a specific restaurant
     */
    getWalletBalance: (restaurantId: string) =>
        axiosClient.get(`/api/restaurants/${restaurantId}/wallet-balance`),

    /**
     * Get all transactions (Super Admin only)
     */
    getAllTransactions: (filters?: TransactionFilters) => {
        const params = new URLSearchParams();
        if (filters) {
            if (filters.status) params.append('status', filters.status);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (filters.type) params.append('type', filters.type);
        }
        const query = params.toString();
        return axiosClient.get(`/api/transactions${query ? `?${query}` : ''}`);
    },

    /**
     * Get transactions for a specific restaurant
     */
    getRestaurantTransactions: (restaurantId: string, filters?: TransactionFilters) => {
        const params = new URLSearchParams();
        if (filters) {
            if (filters.status) params.append('status', filters.status);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (filters.type) params.append('type', filters.type);
        }
        const query = params.toString();
        return axiosClient.get(`/api/transactions/${restaurantId}${query ? `?${query}` : ''}`);
    },

    /**
     * Get a single transaction by ID
     */
    getTransactionById: (transactionId: string) =>
        axiosClient.get(`/api/transactions/detail/${transactionId}`),
};

export default TransactionsAPI;
