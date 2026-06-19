import axiosClient from "../../api/axiosClient";
import { CreateTransactionPayload, Transaction, TransactionFilters, TransactionUploadResponse } from "./types";

const TransactionsAPI = {
    uploadAttachment: (file: File, restaurantId?: string) => {
        const formData = new FormData();
        if (restaurantId) {
            formData.append('restaurantId', restaurantId);
        }
        formData.append('image', file);
        return axiosClient.post<{ data: TransactionUploadResponse }>('/api/upload/transaction', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },

    createTransaction: (restaurantId: string, payload: CreateTransactionPayload) =>
        axiosClient.post<{ data: Transaction }>(`/api/transactions/${restaurantId}/upload`, payload),

    getAllTransactions: (filters: TransactionFilters) =>
        axiosClient.get<{ data: Transaction[] }>('/api/transactions', { params: filters }),

    getRestaurantTransactions: (restaurantId: string, filters: TransactionFilters) =>
        axiosClient.get<{ data: Transaction[] }>(`/api/transactions/${restaurantId}`, { params: filters }),

    updateTransactionStatus: (id: string, status: string) =>
        axiosClient.patch<{ success: boolean; data: Partial<Transaction> }>(`/api/transactions/${id}/status`, { status }),
};

export default TransactionsAPI;
